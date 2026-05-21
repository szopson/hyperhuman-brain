import type { Pain } from '@/lib/schemas';

export interface ProblemScoreBreakdown {
  pain_id: string;
  final_score_0_100: number;
  components: {
    frequency: { value: Pain['frequency']; weight: number };
    severity: { value: Pain['severity']; weight: number };
    strategic: { value: Pain['strategic_impact']; weight: number };
    emotional: {
      value: Pain['founder_emotional_intensity'];
      multiplier: number;
    };
    coverage: { value: number; multiplier: number };
  };
  formula: string;
}

const FREQ_WEIGHT: Record<Pain['frequency'], number> = {
  constant: 1.0,
  daily: 0.85,
  weekly: 0.6,
  monthly: 0.4,
  occasional: 0.2,
};

const SEV_WEIGHT: Record<Pain['severity'], number> = {
  critical: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

const STRAT_WEIGHT: Record<Pain['strategic_impact'], number> = {
  blocks_endgame: 1.0,
  major: 0.75,
  moderate: 0.5,
  minor: 0.25,
};

const EMOTIONAL_MULTIPLIER: Record<Pain['founder_emotional_intensity'], number> = {
  burning: 1.6,
  frustrating: 1.05,
  mentioned: 0.85,
  background: 0.6,
};

export function calculateProblemScore(pain: Pain): ProblemScoreBreakdown {
  const processCoverageBonus = Math.min(
    1.3,
    1 + Math.max(0, pain.affected_processes.length - 1) * 0.1,
  );

  const base =
    FREQ_WEIGHT[pain.frequency] *
    SEV_WEIGHT[pain.severity] *
    STRAT_WEIGHT[pain.strategic_impact];

  const final =
    base *
    EMOTIONAL_MULTIPLIER[pain.founder_emotional_intensity] *
    processCoverageBonus;

  return {
    pain_id: pain.id,
    final_score_0_100: Math.max(0, Math.min(100, Math.round(final * 100))),
    components: {
      frequency: { value: pain.frequency, weight: FREQ_WEIGHT[pain.frequency] },
      severity: { value: pain.severity, weight: SEV_WEIGHT[pain.severity] },
      strategic: {
        value: pain.strategic_impact,
        weight: STRAT_WEIGHT[pain.strategic_impact],
      },
      emotional: {
        value: pain.founder_emotional_intensity,
        multiplier: EMOTIONAL_MULTIPLIER[pain.founder_emotional_intensity],
      },
      coverage: {
        value: pain.affected_processes.length,
        multiplier: processCoverageBonus,
      },
    },
    formula: 'freq × sev × strat × emotional × coverage_bonus',
  };
}
