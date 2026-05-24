import { AppShell } from '@/components/layout/AppShell';
import { computeQualityReport } from '@/lib/eval/metrics';
import { currentCaseSlug } from '@/lib/storage/load-analysis';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function StatusDot({ status }: { status: 'pass' | 'fail' | 'missing' }) {
  const color =
    status === 'pass'
      ? 'bg-emerald-400'
      : status === 'fail'
        ? 'bg-rose-400'
        : 'bg-zinc-500';
  return <span className={cn('inline-block h-2 w-2 rounded-full', color)} />;
}

function Bar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
      <div
        className={cn('h-full', color ?? 'bg-emerald-500')}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export default async function Page() {
  const caseSlug = await currentCaseSlug();
  const r = computeQualityReport(caseSlug);

  return (
    <AppShell active="eval">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            12 · Telemetria pipeline · v0.2
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            Czy mózg nie driftuje
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Metryki operacyjne pipeline-u (case: <span className="text-zinc-200">{r.caseSlug}</span>).
            Bez tego widoku każdy senior AI zapyta &bdquo;jak mierzysz że to działa" i nie będzie odpowiedzi.
          </p>
        </header>

        {/* SCHEMA */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Schema validation
          </h2>
          <div className="mt-3 space-y-2">
            {r.schema.map((s) => (
              <div
                key={s.file}
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={s.status} />
                  <span className="font-mono text-sm text-zinc-200">{s.file}</span>
                </div>
                <span
                  className={cn(
                    'font-mono text-xs',
                    s.status === 'pass' ? 'text-emerald-300' : s.status === 'fail' ? 'text-rose-300' : 'text-zinc-500',
                  )}
                >
                  {s.status}
                  {s.error && <span className="ml-2 text-zinc-500">— {s.error.slice(0, 60)}</span>}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* COVERAGE */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Source quote coverage · twardy kontrakt anti-halucynacji
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {([
              ['pains', r.pains],
              ['risks', r.risks],
              ['processes', r.processes],
            ] as const).map(([label, c]) => (
              <div key={label} className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-50">
                  {c.coveragePct}%
                  <span className="ml-2 font-mono text-xs text-zinc-500">
                    ({c.withQuotes}/{c.total})
                  </span>
                </p>
                <div className="mt-2">
                  <Bar pct={c.coveragePct} color={c.coveragePct === 100 ? 'bg-emerald-500' : 'bg-amber-500'} />
                </div>
                <p className="mt-2 font-mono text-[10px] text-zinc-500">
                  high-conf: {c.withHighConfQuotes}/{c.total}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SCORING DISTRIBUTION */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Scoring distribution · pain problem_score
          </h2>
          <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950 p-4">
            <div className="grid grid-cols-5 gap-2">
              {r.scoring.distribution.map((d) => {
                const max = Math.max(...r.scoring.distribution.map((x) => x.count), 1);
                const h = Math.round((d.count / max) * 100);
                return (
                  <div key={d.bucket} className="flex flex-col items-center">
                    <div className="flex h-24 w-full items-end">
                      <div
                        className={cn(
                          'w-full rounded-t',
                          d.bucket.includes('100') ? 'bg-rose-700' : 'bg-emerald-700',
                        )}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-zinc-400">{d.bucket}</p>
                    <p className="font-mono text-xs text-zinc-200">{d.count}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 font-mono text-[11px] text-zinc-500">
              median: <span className="text-zinc-200">{r.scoring.median}</span>
              {' · '}
              saturated at 100/100: <span className={r.scoring.saturated_100 > 2 ? 'text-rose-300' : 'text-zinc-200'}>{r.scoring.saturated_100}</span>
              {r.scoring.saturated_100 > 2 && (
                <span className="ml-2 text-rose-400">⚠ clamp ceiling — wymaga tie-breaker (v0.3 TODO)</span>
              )}
            </p>
          </div>
        </section>

        {/* PENDING VELOCITY */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Pending queue velocity · 7d
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <Stat label="total" value={r.pending.total} />
            <Stat label="pending now" value={r.pending.pending} color={r.pending.pending > 5 ? 'text-amber-300' : undefined} />
            <Stat label="approved /7d" value={r.pending.approved_7d} color="text-emerald-300" />
            <Stat
              label="approval ratio"
              value={r.pending.approval_ratio === null ? '—' : `${r.pending.approval_ratio}%`}
            />
          </div>
        </section>

        {/* PHASE A′ FIDELITY */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Phase A′ · LLM extraction fidelity
          </h2>
          <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950 p-4">
            {r.extractionFidelity.llmExtracted === 0 ? (
              <p className="font-mono text-xs text-zinc-500">
                no LLM-extracted entries yet · uruchom <code className="rounded bg-zinc-900 px-1.5 py-0.5">npm run ingest -- --llm</code>
              </p>
            ) : (
              <div className="flex items-center gap-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    quote literal in raw_input
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-50">
                    {r.extractionFidelity.fidelityPct}%
                  </p>
                </div>
                <div className="flex-1">
                  <Bar
                    pct={r.extractionFidelity.fidelityPct ?? 0}
                    color={(r.extractionFidelity.fidelityPct ?? 0) >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}
                  />
                  <p className="mt-2 font-mono text-[10px] text-zinc-500">
                    {r.extractionFidelity.quoteLiteralInRaw} z {r.extractionFidelity.llmExtracted} entries — LLM nie zhalucynował cytatu
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* HISTORY */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            History · audit trail
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Stat label="snapshots" value={r.history.snapshots} />
            <Stat
              label="latest"
              value={r.history.latestIso ? new Date(r.history.latestIso).toLocaleString('pl-PL', { hour12: false }) : '—'}
            />
          </div>
        </section>

        <section className="rounded-md border border-dashed border-zinc-800 bg-zinc-900/30 p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Dlaczego ten widok
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Senior AI zapyta &bdquo;jak mierzysz że pipeline nie driftuje, że LLM nie halucynuje cytatów,
            że scoring nie jest psuty przez clamp ceiling, że review queue nie spuchnie do 100 pending"?
            Ten widok to **operational discipline** w jednym miejscu. Każda liczba jest deterministyczna
            (kod policzony z `analysis-full.json` + `pending-queue.json`, nie LLM call).
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold', color ?? 'text-zinc-50')}>{value}</p>
    </div>
  );
}
