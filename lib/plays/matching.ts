import type {
  AIPlay,
  CompanyAnalysis,
  NextStepPack,
  Pain,
  PlayMatch,
  Risk,
} from '@/lib/schemas';
import {
  calculateAIOpportunityScore,
  playMatchFromBreakdown,
} from '@/lib/scoring/ai-opportunity-score';
import type { LeakageScoreBreakdown, ProblemScoreBreakdown } from '@/lib/scoring';

export function matchPlaysToPains(
  pains: Pain[],
  plays: AIPlay[],
): Map<string, Pain[]> {
  const out = new Map<string, Pain[]>();
  for (const play of plays) {
    const matched = pains.filter((pain) =>
      play.solves_pain_categories.includes(pain.category),
    );
    if (matched.length > 0) out.set(play.id, matched);
  }
  return out;
}

export interface ComputePlayMatchesArgs {
  analysis: CompanyAnalysis;
  plays: AIPlay[];
  problem_scores: Map<string, ProblemScoreBreakdown>;
  leakage_scores: Map<string, LeakageScoreBreakdown>;
}

export function computePlayMatches(args: ComputePlayMatchesArgs): PlayMatch[] {
  const { analysis, plays, problem_scores, leakage_scores } = args;
  const painsById = new Map(analysis.pains.map((p) => [p.id, p]));
  const matches: PlayMatch[] = [];

  const painsByPlay = matchPlaysToPains(analysis.pains, plays);

  for (const play of plays) {
    const matched = painsByPlay.get(play.id) ?? [];
    if (matched.length === 0) continue;

    const breakdown = calculateAIOpportunityScore(
      play,
      matched,
      problem_scores,
      analysis.company,
      analysis.processes,
      analysis.tools,
    );

    // Aggregate leakage recovery from matched pains as monthly impact estimate.
    const monthlyImpactPln = matched
      .map((p) => leakage_scores.get(p.id)?.recoverable_monthly_pln ?? 0)
      .reduce((a, b) => a + b, 0);

    const match = playMatchFromBreakdown(
      play,
      matched.map((p) => p.id).filter((id) => painsById.has(id)),
      breakdown,
      monthlyImpactPln > 0 ? monthlyImpactPln : null,
      problem_scores,
    );
    matches.push(match);
  }

  matches.sort((a, b) => b.composite_score - a.composite_score);
  return matches;
}

// ============= Next Step Pack selection =============

interface SelectArgs {
  matches: PlayMatch[];
  plays: AIPlay[];
  pains: Pain[];
  risks: Risk[];
  timelineBudgetWeeks?: number;
}

const LAYER_ORDER: Record<AIPlay['cavac_layer'], number> = {
  brain: 0,
  'founder-facing': 1,
  tools: 2,
  skills: 3,
  workflows: 4,
  cowork: 5,
};

function prerequisitesSatisfied(
  play: AIPlay,
  selectedIds: Set<string>,
): boolean {
  return play.prerequisites.every((req) => {
    // Treat non-P-XXX abstract requirements as already-satisfied.
    if (!req.startsWith('P-')) return true;
    return selectedIds.has(req);
  });
}

export function selectNextStepPlays(args: SelectArgs): NextStepPack {
  const budget = args.timelineBudgetWeeks ?? 12;
  const playById = new Map(args.plays.map((p) => [p.id, p]));
  const painById = new Map(args.pains.map((p) => [p.id, p]));

  const burningPainIds = new Set(
    args.pains
      .filter((p) => p.founder_emotional_intensity === 'burning')
      .map((p) => p.id),
  );
  const imminentRiskIds = new Set(
    args.risks
      .filter((r) => r.time_horizon === 'imminent_3_months')
      .map((r) => r.id),
  );

  const candidates = [...args.matches];
  const selectedIds = new Set<string>();
  const selectedMatches: PlayMatch[] = [];
  let totalWeeks = 0;
  const addressedBurning = new Set<string>();

  const effectiveEffort = (playId: string): number => {
    const play = playById.get(playId);
    if (!play) return Number.POSITIVE_INFINITY;
    return play.effort_weeks_mvp?.typical ?? play.effort_weeks.typical;
  };

  // Iterative greedy: each pass picks single best eligible candidate.
  // Eligible = not selected, prereqs satisfied, budget fits using MVP-when-available.
  // Among eligible, prefer higher composite; tiebreak by lower layer index (Brain first).
  while (true) {
    const eligible = candidates
      .filter((m) => {
        if (selectedIds.has(m.play_id)) return false;
        const play = playById.get(m.play_id);
        if (!play) return false;
        if (!prerequisitesSatisfied(play, selectedIds)) return false;
        if (totalWeeks + effectiveEffort(m.play_id) > budget) return false;
        return true;
      })
      .sort((a, b) => {
        const aP = playById.get(a.play_id)!;
        const bP = playById.get(b.play_id)!;
        if (b.composite_score !== a.composite_score)
          return b.composite_score - a.composite_score;
        return LAYER_ORDER[aP.cavac_layer] - LAYER_ORDER[bP.cavac_layer];
      });

    if (eligible.length === 0) break;
    const pick = eligible[0];
    const play = playById.get(pick.play_id)!;
    const effort = effectiveEffort(pick.play_id);
    const fullEffort = play.effort_weeks.typical;
    if (effort < fullEffort) {
      console.log(
        `[selection] ${pick.play_id} selected with MVP variant (${effort}w) instead of full (${fullEffort}w)`,
      );
    } else {
      console.log(`[selection] ${pick.play_id} selected (${effort}w)`);
    }
    selectedIds.add(pick.play_id);
    selectedMatches.push(pick);
    totalWeeks += effort;
    pick.matched_pains.forEach((pid) => {
      if (burningPainIds.has(pid)) addressedBurning.add(pid);
    });
  }

  // Constraint check: must address ≥1 burning pain if any exist.
  if (burningPainIds.size > 0 && addressedBurning.size === 0) {
    // Force-add highest-scoring play touching a burning pain that fits budget.
    for (const m of candidates) {
      const play = playById.get(m.play_id);
      if (!play || selectedIds.has(play.id)) continue;
      const touchesBurning = m.matched_pains.some((pid) =>
        burningPainIds.has(pid),
      );
      if (!touchesBurning) continue;
      // Bump budget +50% if forced.
      if (totalWeeks + m.estimated_effort_weeks > budget * 1.5) continue;
      selectedIds.add(play.id);
      selectedMatches.push(m);
      totalWeeks += m.estimated_effort_weeks;
      m.matched_pains.forEach((pid) => {
        if (burningPainIds.has(pid)) addressedBurning.add(pid);
      });
      break;
    }
  }

  const selectedPlayIds = Array.from(selectedIds);
  const burningCovered = [...addressedBurning]
    .map((id) => painById.get(id)?.title ?? id)
    .slice(0, 5);

  const layersUsed = new Set(
    selectedPlayIds
      .map((id) => playById.get(id)?.cavac_layer)
      .filter(Boolean) as AIPlay['cavac_layer'][],
  );

  const pack: NextStepPack = {
    id: 'pack-001-first',
    title: `Pierwszy pakiet wdrożeniowy (${selectedPlayIds.length} play, ~${totalWeeks}w)`,
    one_liner: `Pakiet ${selectedPlayIds.length} AI plays adresujących ${addressedBurning.size} burning pain(s) i ${imminentRiskIds.size} imminent risk(s) w budżecie ${totalWeeks}/${budget} tygodni.`,
    selected_plays: selectedPlayIds,
    framing: 'pilot',
    rationale: `Greedy selekcja po composite score z constraints: budżet ${budget}w, layer order brain→tools→skills→workflows→cowork, prerequisites enforced. Coverage: ${addressedBurning.size}/${burningPainIds.size} burning pains, layers used: ${[...layersUsed].join(', ')}.`,
    scope: {
      in_scope: selectedPlayIds.map(
        (id) => `${id}: ${playById.get(id)?.name ?? '?'}`,
      ),
      out_of_scope: [
        'Plays nie spełniające budżetu czasowego pierwszego pakietu',
        'Plays z nieusatysfakcjonowanymi prerequisitami spoza tego pakietu',
      ],
    },
    timeline_weeks: totalWeeks,
    pricing: null,
    deliverables: selectedPlayIds.flatMap((id) => {
      const p = playById.get(id);
      if (!p) return [];
      return [
        `${id} — ${p.name}: ${p.expected_impact_qualitative.slice(0, 120)}`,
      ];
    }),
    success_metrics: [],
    team_required: ['HyperHuman 2-3 osoby', 'Klient: 1 champion + dostęp do danych'],
    client_commitment: [
      'Wywiady ~1h z kluczowymi osobami (P-001)',
      'Dostęp do narzędzi z requires.data',
      'Cotygodniowy 1h checkpoint',
    ],
    risks_and_assumptions: [
      'Selekcja oparta na composite score — może wymagać korekty po review founderskim',
      `Budżet ${budget}w to wstępna estymata; szczegółowa estymacja po decision call`,
    ],
    next_logical_step_after:
      'Layer 2: pozostałe high-score plays + deeper integrations po walidacji Layer 1.',
  };

  return pack;
}
