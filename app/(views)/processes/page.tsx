import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from '@/components/shared/ScoreBar';
import { InspectTrigger } from '@/components/shared/InspectDrawer';

const CAT_COLOR: Record<string, string> = {
  sales: 'bg-emerald-950 text-emerald-200 ring-emerald-800',
  operations: 'bg-cyan-950 text-cyan-200 ring-cyan-800',
  marketing: 'bg-violet-950 text-violet-200 ring-violet-800',
  customer_success: 'bg-blue-950 text-blue-200 ring-blue-800',
  logistics: 'bg-amber-950 text-amber-200 ring-amber-800',
  data_management: 'bg-fuchsia-950 text-fuchsia-200 ring-fuchsia-800',
  finance: 'bg-zinc-800 text-zinc-200 ring-zinc-700',
  product: 'bg-rose-950 text-rose-200 ring-rose-800',
  hr: 'bg-zinc-900 text-zinc-300 ring-zinc-800',
};

export default async function Page() {
  const a = await loadAnalysis();
  const processes = a.processes
    .map((p) => ({
      ...p,
      cavacAvg:
        (p.knowledge_ready.score +
          p.tools_ready.score +
          p.integration_ready.score +
          p.skill_ready.score) /
        4,
    }))
    .sort((x, y) => x.cavacAvg - y.cavacAvg);

  return (
    <AppShell active="processes">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            03 · Mapa procesów
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            {processes.length} procesów w firmie
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Każdy proces oceniony 0–10 w czterech wymiarach gotowości: Wiedza
            (czy spisane procedury), Narzędzia (czy są dobre systemy),
            Integracje (czy systemy się komunikują), Skille (czy można
            zautomatyzować). Sortowane od najsłabszych — to są kandydaci do
            wzmocnienia w pierwszej kolejności.
          </p>
        </header>

        <div className="grid gap-3">
          {processes.map((p) => (
            <article
              key={p.id}
              className="rounded-md border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={`ring-1 text-[10px] ${CAT_COLOR[p.category] ?? 'bg-zinc-800 text-zinc-300 ring-zinc-700'}`}
                    >
                      {p.category}
                    </Badge>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Wykonywany: {p.frequency} · Odpowiedzialny: {p.current_owner_role}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-50">
                    <InspectTrigger
                      payload={{
                        title: `${p.id} · ${p.name}`,
                        subtitle: p.description,
                        quotes: p.source_quotes,
                        extra: [
                          { label: 'category', value: p.category },
                          { label: 'frequency', value: p.frequency },
                          { label: 'owner role', value: p.current_owner_role },
                          {
                            label: 'hours/execution',
                            value: p.estimated_hours_per_execution ?? '—',
                          },
                          {
                            label: 'executions/month',
                            value: p.estimated_executions_per_month ?? '—',
                          },
                          {
                            label: 'depends on',
                            value: p.depends_on.join(', ') || '—',
                          },
                          { label: 'enables', value: p.enables.join(', ') || '—' },
                          {
                            label: 'knowledge gaps',
                            value: p.knowledge_ready.gaps.join('; ') || '—',
                          },
                          {
                            label: 'missing MCPs',
                            value: p.integration_ready.missing_mcp.join(', ') || '—',
                          },
                        ],
                      }}
                    >
                      {p.name}
                    </InspectTrigger>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                    {p.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-3xl font-semibold text-zinc-50">
                    {p.cavacAvg.toFixed(1)}
                    <span className="text-base text-zinc-500">/10</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Gotowość
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ScoreBar label="Wiedza" value={p.knowledge_ready.score} />
                <ScoreBar label="Narzędz." value={p.tools_ready.score} />
                <ScoreBar
                  label="Integr."
                  value={p.integration_ready.score}
                />
                <ScoreBar label="Skille" value={p.skill_ready.score} />
              </div>

              {(p.knowledge_ready.gaps.length > 0 ||
                p.integration_ready.missing_mcp.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  {p.knowledge_ready.gaps.slice(0, 2).map((g, i) => (
                    <span
                      key={`k-${i}`}
                      className="rounded bg-rose-950/40 px-2 py-0.5 text-rose-300 ring-1 ring-rose-900/60"
                    >
                      luka: {g.slice(0, 40)}
                    </span>
                  ))}
                  {p.integration_ready.missing_mcp.slice(0, 2).map((m, i) => (
                    <span
                      key={`m-${i}`}
                      className="rounded bg-amber-950/40 px-2 py-0.5 text-amber-300 ring-1 ring-amber-900/60"
                    >
                      brak integracji: {m}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
