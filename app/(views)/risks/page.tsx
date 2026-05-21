import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { computeAllScores } from '@/lib/scoring';
import { Badge } from '@/components/ui/badge';
import { InspectTrigger } from '@/components/shared/InspectDrawer';
import { cn } from '@/lib/utils';
import type { Risk } from '@/lib/schemas';

const PROB_AXIS: Risk['probability'][] = ['unlikely', 'possible', 'likely', 'certain'];
const IMPACT_AXIS: Risk['impact'][] = ['minor', 'moderate', 'major', 'existential'];

const HORIZON_LABEL: Record<Risk['time_horizon'], string> = {
  imminent_3_months: '< 3 miesięcy',
  near_term_6_12_months: '6-12 miesięcy',
  medium_term_1_2_years: '1-2 lata',
  long_term_2_plus_years: '2+ lat',
};

const PROB_LABEL: Record<Risk['probability'], string> = {
  certain: 'pewne',
  likely: 'prawdopodobne',
  possible: 'możliwe',
  unlikely: 'mało prawdop.',
};

const IMPACT_LABEL: Record<Risk['impact'], string> = {
  existential: 'egzystencjalne',
  major: 'duże',
  moderate: 'umiarkowane',
  minor: 'małe',
};

const MITIGATION_LABEL: Record<Risk['mitigation_status'], string> = {
  none: 'brak',
  planned: 'planowane',
  in_progress: 'w toku',
  partial: 'częściowe',
};

const HORIZON_COLOR: Record<Risk['time_horizon'], string> = {
  imminent_3_months: 'bg-rose-950 text-rose-200 ring-rose-800',
  near_term_6_12_months: 'bg-amber-950 text-amber-200 ring-amber-800',
  medium_term_1_2_years: 'bg-zinc-800 text-zinc-300 ring-zinc-700',
  long_term_2_plus_years: 'bg-zinc-900 text-zinc-400 ring-zinc-800',
};

export default async function Page() {
  const a = await loadAnalysis();
  const { risk_scores } = computeAllScores(a);

  const grid: Record<string, Risk[]> = {};
  for (const r of a.risks) {
    const key = `${r.probability}|${r.impact}`;
    (grid[key] ||= []).push(r);
  }

  const sorted = a.risks
    .map((r) => ({ risk: r, score: risk_scores.get(r.id) }))
    .sort(
      (x, y) =>
        (y.score?.severity_score_0_100 ?? 0) -
        (x.score?.severity_score_0_100 ?? 0),
    );

  return (
    <AppShell active="risks">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            05 · Ryzyka strategiczne
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            {a.risks.length} ryzyk monitorowanych
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Macierz prawdopodobieństwo × skala wpływu. Ocena uwzględnia horyzont
            czasowy (rosnąca dla bliższych) i status zabezpieczenia (rosnąca dla
            niezabezpieczonych). Prawy-górny kwadrant = pilna akcja.
          </p>
        </header>

        {/* QUADRANT MATRIX */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Macierz: prawdopodobieństwo × skala wpływu
          </h2>
          <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="grid grid-cols-[80px_repeat(4,1fr)] gap-1.5 text-xs">
              <div></div>
              {IMPACT_AXIS.map((imp) => (
                <div
                  key={imp}
                  className="px-1 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-500"
                >
                  {IMPACT_LABEL[imp]}
                </div>
              ))}
              {[...PROB_AXIS].reverse().map((prob) => (
                <div key={prob} className="contents">
                  <div className="flex items-center justify-end pr-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {PROB_LABEL[prob]}
                  </div>
                  {IMPACT_AXIS.map((imp) => {
                    const key = `${prob}|${imp}`;
                    const cellRisks = grid[key] ?? [];
                    const isTopRight =
                      (prob === 'certain' || prob === 'likely') &&
                      (imp === 'existential' || imp === 'major');
                    return (
                      <div
                        key={imp}
                        className={cn(
                          'min-h-20 rounded-md border p-2 text-[11px]',
                          isTopRight
                            ? 'border-rose-900/60 bg-rose-950/20'
                            : 'border-zinc-800 bg-zinc-950',
                          cellRisks.length === 0 && 'opacity-40',
                        )}
                      >
                        {cellRisks.map((r) => (
                          <p
                            key={r.id}
                            className="text-zinc-200 line-clamp-2"
                            title={r.title}
                          >
                            • {r.title.slice(0, 50)}
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LISTING */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Wszystkie ryzyka · sortowane wg pilności
          </h2>
          <div className="mt-3 space-y-2">
            {sorted.map(({ risk, score }) => (
              <article
                key={risk.id}
                className="rounded-md border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700 text-[10px]">
                        {risk.category}
                      </Badge>
                      <Badge
                        className={cn(
                          'ring-1 text-[10px]',
                          HORIZON_COLOR[risk.time_horizon],
                        )}
                      >
                        {HORIZON_LABEL[risk.time_horizon]}
                      </Badge>
                      <span className="text-[10px] text-zinc-500">
                        prawdop.: {PROB_LABEL[risk.probability]} · wpływ: {IMPACT_LABEL[risk.impact]} ·
                        zabezp.: {MITIGATION_LABEL[risk.mitigation_status]}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-zinc-50">
                      <InspectTrigger
                        payload={{
                          title: `${risk.id} · ${risk.title}`,
                          subtitle: risk.description,
                          quotes: risk.source_quotes,
                          scoreMath: score
                            ? {
                                formula: score.formula,
                                components: score.components,
                                final_score_0_100: score.severity_score_0_100,
                              }
                            : undefined,
                          extra: [
                            { label: 'category', value: risk.category },
                            {
                              label: 'specific actors',
                              value: risk.specific_actors?.join(', ') ?? '—',
                            },
                            { label: 'quadrant', value: score?.quadrant ?? '—' },
                          ],
                        }}
                      >
                        {risk.title}
                      </InspectTrigger>
                    </h3>
                    {risk.specific_actors && risk.specific_actors.length > 0 && (
                      <p className="mt-1 text-xs text-zinc-500">
                        gracze:{' '}
                        <span className="text-zinc-300">
                          {risk.specific_actors.join(', ')}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-2xl font-semibold text-zinc-50">
                      {score?.severity_score_0_100 ?? '—'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                      pilność
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
