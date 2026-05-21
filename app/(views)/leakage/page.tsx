import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { computeAllScores } from '@/lib/scoring';
import { InspectTrigger } from '@/components/shared/InspectDrawer';

const fmt = (n: number) => n.toLocaleString('pl-PL');

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
            View 04 · Revenue Leakage
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            ~{fmt(Math.round(totalRecoverable / 1000))}k PLN/mo recoverable
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Każda kwota = estymata, NIE pomiar. Kliknij liczbę żeby zobaczyć
            assumptions, recoverability rate i sensitivity range ±50%. Bazowa
            estymata używa severity × frequency × kategoria-specific recoverability.
            Cap: 500k PLN/mo per pain żeby uniknąć absurdów.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Total estimated monthly leak"
            value={`${fmt(Math.round(totalLeak / 1000))}k PLN`}
            sub="Suma surowych estymat per pain"
          />
          <SummaryCard
            label="Total recoverable monthly"
            value={`${fmt(Math.round(totalRecoverable / 1000))}k PLN`}
            sub="Po recoverability rate per category"
          />
          <SummaryCard
            label="Annual recovery potential"
            value={`${fmt(Math.round((totalRecoverable * 12) / 1000))}k PLN`}
            sub="12 × monthly · zakładając stabilny baseline"
          />
        </section>

        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Leakage per pain
          </h2>
          <div className="mt-3 overflow-x-auto rounded-md border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Pain</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Raw leak/mo</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 font-medium">Recoverable/mo</th>
                  <th className="px-4 py-3 font-medium">Range ±50%</th>
                  <th className="px-4 py-3 font-medium">Conf</th>
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
                      <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
                        {r.pain.id}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {r.pain.category}
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
                      {r.leakage?.confidence ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-900/60 text-xs">
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-300" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-200">
                    {fmt(totalLeak)} PLN
                  </td>
                  <td className="px-4 py-3 text-zinc-500">avg blended</td>
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
          Methodology: Recovery rate per category — manual_repetitive_work 0.8,
          time_waste 0.7, data_quality 0.6, tooling_friction 0.55, scaling_blocker
          0.5, knowledge_silos 0.5, communication_breakdown 0.45, lost_context 0.4,
          customer_experience 0.35, lost_revenue 0.3, compliance_risk 0.6. Per-pain
          cap 500k PLN/mo żeby unikać absurdów (revenue-as-leak conflation).
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
