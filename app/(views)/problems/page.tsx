import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { PLAYS } from '@/lib/plays/library';
import { computeAllScores } from '@/lib/scoring';
import { Badge } from '@/components/ui/badge';
import { InspectTrigger } from '@/components/shared/InspectDrawer';
import { cn } from '@/lib/utils';

const SEV_COLOR: Record<string, string> = {
  critical: 'bg-rose-900/60 text-rose-100 ring-rose-700',
  high: 'bg-amber-900/60 text-amber-100 ring-amber-700',
  medium: 'bg-zinc-800 text-zinc-200 ring-zinc-700',
  low: 'bg-zinc-900 text-zinc-400 ring-zinc-800',
};

const EMO_COLOR: Record<string, string> = {
  burning: 'bg-rose-950 text-rose-200 ring-rose-800',
  frustrating: 'bg-amber-950 text-amber-200 ring-amber-800',
  mentioned: 'bg-zinc-900 text-zinc-400 ring-zinc-800',
  background: 'bg-zinc-950 text-zinc-600 ring-zinc-900',
};

export default async function Page() {
  const a = await loadAnalysis();
  const { problem_scores, leakage_scores } = computeAllScores(a);

  const rows = a.pains
    .map((p) => {
      const ps = problem_scores.get(p.id);
      const ls = leakage_scores.get(p.id);
      const matchingPlays = PLAYS.filter((pl) =>
        pl.solves_pain_categories.includes(p.category),
      );
      return { pain: p, score: ps, leakage: ls, plays: matchingPlays };
    })
    .sort(
      (x, y) =>
        (y.score?.final_score_0_100 ?? 0) - (x.score?.final_score_0_100 ?? 0),
    );

  return (
    <AppShell active="problems">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            View 02 · Problem Map
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            {rows.length} pains identified
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Sorted by Problem Score (frequency × severity × strategic × emotional ×
            coverage). Click any score to inspect scoring math + source quotes +
            leakage estimate.
          </p>
        </header>

        <div className="overflow-x-auto rounded-md border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Sev</th>
                <th className="px-4 py-3 font-medium">Emo</th>
                <th className="px-4 py-3 font-medium">Freq</th>
                <th className="px-4 py-3 font-medium">€/mo</th>
                <th className="px-4 py-3 font-medium">Plays</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((r, i) => (
                <tr
                  key={r.pain.id}
                  className={cn(
                    'transition hover:bg-zinc-900/50',
                    i < 5 && 'bg-zinc-900/30',
                  )}
                >
                  <td className="px-4 py-3 font-mono text-zinc-500">{i + 1}</td>
                  <td className="px-4 py-3 align-top">
                    <InspectTrigger
                      payload={{
                        title: r.pain.title,
                        subtitle: 'Scoring math + source quotes',
                        quotes: r.pain.source_quotes,
                        scoreMath: r.score
                          ? {
                              formula: r.score.formula,
                              components: r.score.components,
                              final_score_0_100: r.score.final_score_0_100,
                            }
                          : undefined,
                        extra: r.leakage
                          ? [
                              {
                                label: 'est. monthly leak',
                                value: `${r.leakage.estimated_monthly_leak_pln.toLocaleString()} PLN`,
                              },
                              {
                                label: 'recoverable monthly',
                                value: `${r.leakage.recoverable_monthly_pln.toLocaleString()} PLN`,
                              },
                              {
                                label: 'recoverability rate',
                                value: `${(r.leakage.recoverability_rate * 100).toFixed(0)}%`,
                              },
                              {
                                label: 'leakage confidence',
                                value: r.leakage.confidence,
                              },
                            ]
                          : undefined,
                      }}
                      className="font-mono text-base font-semibold text-zinc-50 no-underline"
                    >
                      {r.score?.final_score_0_100 ?? '—'}
                    </InspectTrigger>
                    {i < 5 && (
                      <div className="mt-0.5 text-[10px] uppercase text-rose-400">
                        Critical
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-md align-top">
                    <p className="text-zinc-100">{r.pain.title}</p>
                    {r.pain.founder_quoted_phrase && (
                      <p className="mt-0.5 text-xs italic text-zinc-500">
                        &ldquo;{r.pain.founder_quoted_phrase.slice(0, 90)}&rdquo;
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="font-mono text-xs text-zinc-400">
                      {r.pain.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge className={cn('ring-1', SEV_COLOR[r.pain.severity])}>
                      {r.pain.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge
                      className={cn(
                        'ring-1',
                        EMO_COLOR[r.pain.founder_emotional_intensity],
                      )}
                    >
                      {r.pain.founder_emotional_intensity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400 align-top">
                    {r.pain.frequency}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-300 align-top">
                    {r.leakage
                      ? `${(r.leakage.recoverable_monthly_pln / 1000).toFixed(0)}k`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs align-top">
                    {r.plays.length > 0 ? (
                      <span className="text-zinc-300">
                        {r.plays
                          .slice(0, 3)
                          .map((p) => p.id)
                          .join(', ')}
                        {r.plays.length > 3 && (
                          <span className="text-zinc-500">
                            {' '}
                            +{r.plays.length - 3}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
