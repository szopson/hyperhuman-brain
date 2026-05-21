import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { computeAllScores } from '@/lib/scoring';
import { InspectTrigger } from '@/components/shared/InspectDrawer';

const fmt = (n: number) => n.toLocaleString('pl-PL');

const PAIN_CATEGORY_LABEL: Record<string, string> = {
  time_waste: 'Strata czasu',
  manual_repetitive_work: 'Praca ręczna',
  knowledge_silos: 'Wiedza w głowach',
  lost_context: 'Brak kontekstu',
  data_quality: 'Jakość danych',
  communication_breakdown: 'Komunikacja',
  tooling_friction: 'Narzędzia',
  lost_revenue: 'Stracony przychód',
  customer_experience: 'Doświadczenie klienta',
  compliance_risk: 'Compliance',
  scaling_blocker: 'Bariera wzrostu',
};

export default async function Page() {
  const a = await loadAnalysis();
  const { leakage_scores, problem_scores } = computeAllScores(a);

  const rows = a.pains
    .map((p) => {
      const ls = leakage_scores.get(p.id);
      const ps = problem_scores.get(p.id);
      return { pain: p, leakage: ls, ps };
    })
    .sort(
      (x, y) =>
        (y.leakage?.recoverable_monthly_pln ?? 0) -
        (x.leakage?.recoverable_monthly_pln ?? 0),
    );

  const totalLeak = rows.reduce(
    (acc, r) => acc + (r.leakage?.estimated_monthly_leak_pln ?? 0),
    0,
  );
  const totalRecoverable = rows.reduce(
    (acc, r) => acc + (r.leakage?.recoverable_monthly_pln ?? 0),
    0,
  );

  return (
    <AppShell active="leakage">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            04 · Gdzie uciekają pieniądze
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            ~{fmt(Math.round(totalRecoverable / 1000))}k PLN/mo recoverable
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Każda kwota to estymata, nie pomiar. Kliknij sumę aby zobaczyć
            założenia i zakres niepewności ±50%. Bazujemy na intensywności
            problemu × częstotliwości × szansie odzysku zależnej od typu.
            Maksymalna kwota per problem: 500 tys. PLN/m-c, żeby uniknąć
            zawyżenia.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Szacunkowa miesięczna strata"
            value={`${fmt(Math.round(totalLeak / 1000))}k PLN`}
            sub="Suma surowych estymat per problem"
          />
          <SummaryCard
            label="Możliwe do odzyskania"
            value={`${fmt(Math.round(totalRecoverable / 1000))}k PLN`}
            sub="Po realnym współczynniku odzysku"
          />
          <SummaryCard
            label="Potencjał roczny"
            value={`${fmt(Math.round((totalRecoverable * 12) / 1000))}k PLN`}
            sub="12 miesięcy · stabilna baza"
          />
        </section>

        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Wyciek per problem
          </h2>
          <div className="mt-3 overflow-x-auto rounded-md border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Problem</th>
                  <th className="px-4 py-3 font-medium">Bolączka</th>
                  <th className="px-4 py-3 font-medium">Strata/m-c</th>
                  <th className="px-4 py-3 font-medium">Odzysk %</th>
                  <th className="px-4 py-3 font-medium">Możliwe do odzyskania</th>
                  <th className="px-4 py-3 font-medium">Zakres ±50%</th>
                  <th className="px-4 py-3 font-medium">Pewność</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rows.map((r) => (
                  <tr
                    key={r.pain.id}
                    className="transition hover:bg-zinc-900/40"
                  >
                    <td className="px-4 py-3 max-w-md">
                      <p className="text-zinc-100">{r.pain.title}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {PAIN_CATEGORY_LABEL[r.pain.category] ?? r.pain.category}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {r.leakage
                        ? `${fmt(r.leakage.estimated_monthly_leak_pln)} PLN`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {r.leakage
                        ? `${(r.leakage.recoverability_rate * 100).toFixed(0)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.leakage ? (
                        <InspectTrigger
                          payload={{
                            title: r.pain.title,
                            subtitle: 'Leakage scoring math',
                            quotes: r.pain.source_quotes,
                            scoreMath: {
                              formula:
                                'estimated_monthly_leak × recoverability_rate (capped at 500k PLN/mo)',
                              components: {
                                estimated_monthly_leak_pln:
                                  r.leakage.estimated_monthly_leak_pln,
                                recoverability_rate:
                                  r.leakage.recoverability_rate,
                                recoverable_monthly_pln:
                                  r.leakage.recoverable_monthly_pln,
                                sensitivity_range_50pct:
                                  r.leakage.sensitivity_range,
                                confidence: r.leakage.confidence,
                                assumptions_used: r.leakage.assumptions_used,
                              },
                              final_score_0_100: r.leakage.score_0_100,
                            },
                          }}
                          className="font-mono text-sm font-semibold text-zinc-50 no-underline"
                        >
                          {fmt(r.leakage.recoverable_monthly_pln)} PLN
                        </InspectTrigger>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                      {r.leakage
                        ? `${fmt(r.leakage.sensitivity_range[0])} – ${fmt(r.leakage.sensitivity_range[1])}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs uppercase text-zinc-400">
                      {r.leakage
                        ? r.leakage.confidence === 'high'
                          ? 'wysoka'
                          : r.leakage.confidence === 'medium'
                            ? 'średnia'
                            : 'niska'
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-900/60 text-xs">
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-300" colSpan={2}>
                    Razem
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-200">
                    {fmt(totalLeak)} PLN
                  </td>
                  <td className="px-4 py-3 text-zinc-500">średnia ważona</td>
                  <td className="px-4 py-3 font-mono text-zinc-50">
                    {fmt(totalRecoverable)} PLN
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <p className="text-xs text-zinc-500">
          Metodologia: współczynnik odzysku dobierany per typ problemu — praca
          ręczna 80%, strata czasu 70%, jakość danych i compliance 60%, narzędzia
          55%, wiedza i bariera wzrostu 50%, komunikacja 45%, brak kontekstu 40%,
          doświadczenie klienta 35%, stracony przychód 30%. Maksymalna kwota per
          problem: 500 tys. PLN/m-c.
        </p>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-50">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}
