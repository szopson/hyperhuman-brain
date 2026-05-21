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
  { id: 'suggested', label: 'Zasugerowane', color: 'border-zinc-800' },
  { id: 'assigned', label: 'Przypisane', color: 'border-blue-900/60' },
  { id: 'in_progress', label: 'W toku', color: 'border-amber-900/60' },
  { id: 'completed', label: 'Zrealizowane', color: 'border-emerald-900/60' },
];

const URGENCY_LABEL: Record<PreviewAction['urgency'], string> = {
  urgent: 'pilne',
  soon: 'szybko',
  this_quarter: 'ten kwartał',
  when_possible: 'gdy będzie czas',
};

const CATEGORY_LABEL: Record<PreviewAction['category'], string> = {
  sales_operations: 'sprzedaż',
  strategy: 'strategia',
  tooling: 'narzędzia',
  data_quality: 'jakość danych',
};

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
            08 · Plan działania
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            {a.action_points.length === 0
              ? `${previewActions.length} działań do podjęcia`
              : `${a.action_points.length} działań w planie`}
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Przepływ: zasugerowane → przypisane → w toku → zrealizowane.
            {a.action_points.length === 0 && (
              <>
                {' '}
                <span className="text-amber-400">
                  Pełny lifecycle z drag-and-drop i śledzeniem wyników
                </span>{' '}
                dostarcza wdrożenie &bdquo;Generator planów działania&rdquo;
                (część naszej propozycji). Poniżej podgląd wygenerowany
                automatycznie z głównych problemów + pilnych ryzyk.
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
                        Brak działań w tym stanie
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
                            {URGENCY_LABEL[act.urgency]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-zinc-700 text-[9px]"
                          >
                            {CATEGORY_LABEL[act.category]}
                          </Badge>
                        </div>
                        <h4 className="mt-2 text-sm font-medium text-zinc-100 line-clamp-2">
                          {act.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2">
                          {act.rationale}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="text-zinc-500">
                            {act.owner_role}
                          </span>
                          <span className="text-zinc-600">
                            źródło: {act.origin.replace(/^(pain|risk) /, '')}
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
            Dlaczego tylko podgląd
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Plan działania to operacyjna warstwa mózgu firmy. Generowanie
            konkretnych zadań z analizy (problem × ryzyko × sygnał rynkowy ×
            szansa) i ich śledzenie to praca wdrożenia &bdquo;Generator planów
            działania&rdquo;, część naszej propozycji. Po jego wdrożeniu ten
            widok przekształci się w pełen Kanban z drag-and-drop, przypisywaniem
            odpowiedzialności, terminami i śledzeniem rezultatów.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
