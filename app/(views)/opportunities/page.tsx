import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { PLAYS, getPlayById } from '@/lib/plays/library';
import { Badge } from '@/components/ui/badge';
import { InspectTrigger } from '@/components/shared/InspectDrawer';
import { cn } from '@/lib/utils';

const LAYER_COLOR: Record<string, string> = {
  brain: 'bg-violet-950 text-violet-200 ring-violet-800',
  'founder-facing': 'bg-amber-950 text-amber-200 ring-amber-800',
  tools: 'bg-cyan-950 text-cyan-200 ring-cyan-800',
  skills: 'bg-emerald-950 text-emerald-200 ring-emerald-800',
  workflows: 'bg-blue-950 text-blue-200 ring-blue-800',
  cowork: 'bg-zinc-900 text-zinc-300 ring-zinc-800',
};

export default async function Page() {
  const a = await loadAnalysis();
  const rows = a.play_matches.slice(0, 15);

  return (
    <AppShell active="opportunities">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            View 06 · AI Opportunity Ranking
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            {a.play_matches.length} matched plays — top {rows.length} shown
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Composite formula: 0.3·BI + 0.15·AI fit + 0.25·CAVAC + 0.15·Ease +
            0.15·Data readiness. Founder-facing plays get +10 boost in mid-growth-trap
            strategic phase. Click composite score to inspect math.
          </p>
        </header>

        <div className="overflow-x-auto rounded-md border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  #
                </th>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  Play
                </th>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  Composite
                </th>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  BI
                </th>
                <th
                  className="border-l border-zinc-800 px-3 py-3 text-center font-medium"
                  rowSpan={2}
                >
                  AI fit
                </th>
                <th
                  className="border-l border-zinc-800 px-3 py-2 text-center font-medium"
                  colSpan={4}
                >
                  CAVAC ready
                </th>
                <th
                  className="border-l border-zinc-800 px-3 py-3 font-medium"
                  rowSpan={2}
                >
                  Ease
                </th>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  Effort
                </th>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  €/mo
                </th>
              </tr>
              <tr className="text-[10px] text-zinc-600">
                <th className="border-l border-zinc-800 px-3 py-1 text-center">
                  K
                </th>
                <th className="px-3 py-1 text-center">T</th>
                <th className="px-3 py-1 text-center">I</th>
                <th className="px-3 py-1 text-center">S</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((m, i) => {
                const play = getPlayById(m.play_id);
                if (!play) return null;
                const c = m.cavac_readiness;
                const isFounderFacing = play.cavac_layer === 'founder-facing';
                const mvp = play.effort_weeks_mvp?.typical;
                const full = play.effort_weeks.typical;
                return (
                  <tr
                    key={m.play_id}
                    className={cn(
                      'transition hover:bg-zinc-900/50',
                      isFounderFacing &&
                        'bg-amber-950/30 ring-1 ring-amber-900/40',
                    )}
                  >
                    <td className="px-3 py-3 font-mono text-zinc-500">{i + 1}</td>
                    <td className="px-3 py-3 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-400">
                          {play.id}
                        </span>
                        <Badge
                          className={cn(
                            'ring-1 text-[10px]',
                            LAYER_COLOR[play.cavac_layer],
                          )}
                        >
                          {play.cavac_layer}
                        </Badge>
                        {isFounderFacing && (
                          <Badge className="bg-amber-900 text-amber-100 ring-1 ring-amber-700 text-[10px]">
                            +10 boost
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-zinc-100">{play.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                        {play.one_liner}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <InspectTrigger
                        payload={{
                          title: `${play.id} · ${play.name}`,
                          subtitle: play.one_liner,
                          quotes: [],
                          scoreMath: {
                            formula: 'composite_score',
                            components: {
                              business_impact_score: m.business_impact_score,
                              ai_fit_score: m.ai_fit_score,
                              cavac_readiness: m.cavac_readiness,
                              implementation_ease_score: m.implementation_ease_score,
                              data_readiness_score: m.data_readiness_score,
                              matched_pains: m.matched_pains,
                              caveats: m.caveats,
                              reasoning: m.reasoning,
                            },
                            final_score_0_100: m.composite_score,
                          },
                          extra: [
                            { label: 'matched pains', value: m.matched_pains.length },
                            { label: 'confidence', value: m.confidence },
                            {
                              label: 'effort (full)',
                              value: `${play.effort_weeks.typical}w`,
                            },
                            {
                              label: 'effort (MVP)',
                              value: mvp ? `${mvp}w` : '—',
                            },
                            {
                              label: 'monthly impact (PLN)',
                              value: m.estimated_impact_pln_monthly
                                ? m.estimated_impact_pln_monthly.toLocaleString()
                                : '—',
                            },
                            { label: 'prerequisites', value: play.prerequisites.join(', ') || '—' },
                            { label: 'solution', value: play.solution_pattern.slice(0, 200) + '…' },
                            { label: 'qualitative', value: play.expected_impact_qualitative.slice(0, 200) + '…' },
                          ],
                        }}
                        className="font-mono text-base font-semibold text-zinc-50 no-underline"
                      >
                        {m.composite_score}
                      </InspectTrigger>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                      {m.business_impact_score.toFixed(1)}
                    </td>
                    <td className="border-l border-zinc-800 px-3 py-3 text-center font-mono text-xs text-zinc-300">
                      {m.ai_fit_score.toFixed(1)}
                    </td>
                    <td className="border-l border-zinc-800 px-3 py-3 text-center font-mono text-xs text-zinc-400">
                      {c.knowledge.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs text-zinc-400">
                      {c.tools.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs text-zinc-400">
                      {c.integrations.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs text-zinc-400">
                      {c.skills.toFixed(1)}
                    </td>
                    <td className="border-l border-zinc-800 px-3 py-3 font-mono text-xs text-zinc-300">
                      {m.implementation_ease_score.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                      {mvp ? (
                        <>
                          <span className="text-emerald-300">{mvp}w</span>
                          <span className="text-zinc-600"> / {full}w</span>
                        </>
                      ) : (
                        `${full}w`
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                      {m.estimated_impact_pln_monthly
                        ? `${(m.estimated_impact_pln_monthly / 1000).toFixed(0)}k`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-zinc-500">
          Legend · K=knowledge T=tools I=integrations S=skills · MVP variant shown
          in green when defined · Founder-facing tier highlighted with amber tint
        </p>
      </div>
    </AppShell>
  );
}
