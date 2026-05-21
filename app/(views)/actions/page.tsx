import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { computeAllScores } from '@/lib/scoring';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Phase A pipeline emits action_points: []. P-021 (Action Points Generator)
// is the play that populates this view. Until then, we synthesize a preview
// from top scored pains + imminent risks — clearly labeled as "preview".

interface PreviewAction {
  id: string;
  title: string;
  rationale: string;
  category: 'sales_operations' | 'strategy' | 'tooling' | 'data_quality';
  urgency: 'urgent' | 'soon' | 'this_quarter' | 'when_possible';
  importance: 'critical' | 'high' | 'medium';
  owner_role: string;
  origin: string;
}

const URGENCY_COLOR: Record<PreviewAction['urgency'], string> = {
  urgent: 'bg-rose-900/60 text-rose-100 ring-rose-700',
  soon: 'bg-amber-900/60 text-amber-100 ring-amber-700',
  this_quarter: 'bg-zinc-800 text-zinc-200 ring-zinc-700',
  when_possible: 'bg-zinc-900 text-zinc-400 ring-zinc-800',
};

const STATUSES = [
  { id: 'suggested', label: 'Suggested', color: 'border-zinc-800' },
  { id: 'assigned', label: 'Assigned', color: 'border-blue-900/60' },
  { id: 'in_progress', label: 'In progress', color: 'border-amber-900/60' },
  { id: 'completed', label: 'Completed', color: 'border-emerald-900/60' },
];

export default async function Page() {
  const a = await loadAnalysis();
  const { problem_scores, risk_scores } = computeAllScores(a);

  // Synthesize preview actions from top pains + imminent risks.
  const previewActions: PreviewAction[] = [];
  const topPains = a.pains
    .map((p) => ({ p, s: problem_scores.get(p.id)?.final_score_0_100 ?? 0 }))
    .sort((x, y) => y.s - x.s)
    .slice(0, 3);
  for (const { p } of topPains) {
    previewActions.push({
      id: `act-${p.id}`,
      title: `Adresować pain: ${p.title}`,
      rationale: p.description.slice(0, 160) + '…',
      category:
        p.category === 'data_quality'
          ? 'data_quality'
          : p.category === 'tooling_friction'
            ? 'tooling'
            : 'sales_operations',
      urgency: p.founder_emotional_intensity === 'burning' ? 'urgent' : 'soon',
      importance: p.severity === 'critical' ? 'critical' : 'high',
      owner_role: 'Founder + Head of Sales',
      origin: `pain ${p.id}`,
    });
  }
  const imminentRisks = a.risks.filter(
    (r) => r.time_horizon === 'imminent_3_months',
  );
  for (const r of imminentRisks.slice(0, 2)) {
    previewActions.push({
      id: `act-${r.id}`,
      title: `Plan mitigacji: ${r.title}`,
      rationale: r.description.slice(0, 160) + '…',
      category: 'strategy',
      urgency: 'soon',
      importance: r.impact === 'existential' ? 'critical' : 'high',
      owner_role: 'Co-founder',
      origin: `risk ${r.id}`,
    });
  }

  return (
    <AppShell active="actions">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            View 08 · Action Points
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            {a.action_points.length === 0
              ? `${previewActions.length} preview actions`
              : `${a.action_points.length} action points`}
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Lifecycle: suggested → assigned → in_progress → completed → outcome.
            {a.action_points.length === 0 && (
              <>
                {' '}
                <span className="text-amber-400">
                  Phase A nie populuje action points
                </span>{' '}
                — to dostarcza P-021 (Action Points Generator). Poniżej preview
                wygenerowany deterministycznie z top pains + imminent risks dla
                demo Day 4.
              </>
            )}
          </p>
        </header>

        {/* KANBAN COLUMNS */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Kanban · status flow
          </h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-4">
            {STATUSES.map((status) => {
              const inCol =
                status.id === 'suggested' ? previewActions : [];
              return (
                <div
                  key={status.id}
                  className={cn(
                    'rounded-md border bg-zinc-900/30 p-3',
                    status.color,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                      {status.label}
                    </h3>
                    <span className="font-mono text-xs text-zinc-500">
                      {inCol.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {inCol.length === 0 && (
                      <p className="rounded border border-dashed border-zinc-800 px-2 py-3 text-center text-[11px] text-zinc-600">
                        Brak akcji w tym stanie
                      </p>
                    )}
                    {inCol.map((act) => (
                      <article
                        key={act.id}
                        className="rounded border border-zinc-800 bg-zinc-950 p-3"
                      >
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={cn(
                              'ring-1 text-[9px]',
                              URGENCY_COLOR[act.urgency],
                            )}
                          >
                            {act.urgency}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-zinc-700 text-[9px]"
                          >
                            {act.category}
                          </Badge>
                        </div>
                        <h4 className="mt-2 text-sm font-medium text-zinc-100 line-clamp-2">
                          {act.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2">
                          {act.rationale}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="font-mono text-zinc-500">
                            {act.owner_role}
                          </span>
                          <span className="font-mono text-zinc-600">
                            ← {act.origin}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-md border border-dashed border-zinc-800 bg-zinc-900/30 p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Why preview only?
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Action points są <em>operational layer</em> mózgu firmy. Generowanie
            ich z analizy (pain × risk × market signal × opportunity) to robota
            play <span className="font-mono text-zinc-200">P-021</span>, część
            pakietu w widoku Next Step. Po wdrożeniu P-021 ta strona ładuje się z{' '}
            <span className="font-mono text-zinc-200">analysis_full.action_points</span>{' '}
            wzbogaconych o owner, due date, status. UI Kanban z drag-and-drop +
            outcome tracking dochodzi razem z P-021.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
