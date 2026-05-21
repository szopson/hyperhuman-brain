import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { Badge } from '@/components/ui/badge';
import { InspectTrigger } from '@/components/shared/InspectDrawer';

function fmtMoney(value: number, currency: string): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${currency}`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k ${currency}`;
  return `${value} ${currency}`;
}

export default async function Page() {
  const a = await loadAnalysis();
  const burningPains = a.pains.filter(
    (p) => p.founder_emotional_intensity === 'burning',
  );
  const founderPain = a.pains.find((p) => p.id === 'pain-founder-detachment');
  const topCompetitor = a.competitors
    .slice()
    .sort((x, y) => {
      const order = { existential: 4, high: 3, medium: 2, low: 1, irrelevant: 0 };
      return order[y.threat_level] - order[x.threat_level];
    })[0];

  return (
    <AppShell active="snapshot">
      <div className="mx-auto max-w-5xl space-y-10">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            01 · Stan firmy
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            {a.company.name}
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-400">{a.company.business_model}</p>
        </header>

        {/* HERO DIAGNOZA */}
        {founderPain && (
          <section className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-900 text-amber-100 hover:bg-amber-900">
                Diagnoza HyperHuman
              </Badge>
              <span className="text-xs text-amber-300/70">
                pułapka średniego rozwoju
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-zinc-50">
              <InspectTrigger
                payload={{
                  title: founderPain.title,
                  subtitle: founderPain.description,
                  quotes: founderPain.source_quotes,
                }}
              >
                {founderPain.title}
              </InspectTrigger>
            </h2>
            <p className="mt-3 text-zinc-300">{founderPain.description}</p>
          </section>
        )}

        {/* COMPANY METRICS */}
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Firma w liczbach
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Przychód (est.)"
              value={
                a.company.revenue_estimate
                  ? fmtMoney(
                      a.company.revenue_estimate.value,
                      a.company.revenue_estimate.currency,
                    )
                  : '—'
              }
              sub={a.company.revenue_estimate?.period ?? ''}
              quotes={a.company.source_quotes}
              quotesTitle="Revenue source quotes"
            />
            <MetricCard
              label="Lat na rynku"
              value={a.company.years_in_business?.toString() ?? '—'}
              sub="zarządzane przez founderów"
              quotes={a.company.source_quotes}
              quotesTitle="Skąd to wiemy — lata działalności"
            />
            <MetricCard
              label="Branża"
              value={a.company.industry.slice(0, 30)}
              sub={a.company.sub_industry?.slice(0, 50) ?? ''}
              quotes={a.company.source_quotes}
              quotesTitle="Skąd to wiemy — branża"
            />
            <MetricCard
              label="Rynki geograficzne"
              value={a.company.geo_markets.slice(0, 5).join(', ')}
              sub={`${a.company.geo_markets.length} rynków`}
              quotes={a.company.source_quotes}
              quotesTitle="Skąd to wiemy — geografia"
            />
          </div>

          {a.company.revenue_breakdown && (
            <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Skąd pochodzi przychód
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(a.company.revenue_breakdown).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-zinc-400">{k}</span>
                    <span className="font-mono text-zinc-200">
                      {(v * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* STRATEGIC AZYMUT */}
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Strategiczny azymut
          </h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Główne zagrożenie konkurencyjne
              </p>
              {topCompetitor ? (
                <>
                  <p className="mt-2 text-xl font-semibold text-zinc-50">
                    {topCompetitor.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    {topCompetitor.model}
                  </p>
                  <div className="mt-3 flex gap-2 text-xs">
                    <Badge className="bg-rose-900/50 text-rose-200 hover:bg-rose-900/50">
                      zagrożenie: {topCompetitor.threat_level}
                    </Badge>
                    <Badge variant="outline" className="border-zinc-700">
                      reagować w: {topCompetitor.time_to_react}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">brak danych</p>
              )}
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Problemy krytyczne dla zarządu
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-50">
                {burningPains.length}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {burningPains.slice(0, 3).map((p) => (
                  <li key={p.id} className="text-zinc-300">
                    • {p.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* DATA GAPS */}
        {a.data_gaps.length > 0 && (
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Czego jeszcze nie wiemy
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
              {a.data_gaps.map((g, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-zinc-600">▸</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="border-t border-zinc-800 pt-6 text-xs text-zinc-500">
          Pewność analizy:{' '}
          <span className="font-mono uppercase text-zinc-300">
            {a.overall_confidence === 'high' ? 'wysoka' : a.overall_confidence === 'medium' ? 'średnia' : 'niska'}
          </span>{' '}
          · {a.processes.length} procesów · {a.pains.length} problemów ·{' '}
          {a.risks.length} ryzyk · {a.tools.length} narzędzi · {a.stakeholders.length}{' '}
          osób
        </footer>
      </div>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  sub,
  quotes,
  quotesTitle,
}: {
  label: string;
  value: string;
  sub?: string;
  quotes: import('@/lib/schemas').SourceQuote[];
  quotesTitle: string;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <InspectTrigger
        payload={{ title: quotesTitle, quotes }}
        className="mt-2 block text-xl font-semibold text-zinc-50 no-underline hover:text-zinc-100"
      >
        {value}
      </InspectTrigger>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
