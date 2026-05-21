import type { Risk } from '@/lib/schemas';

export interface RiskScoreBreakdown {
  risk_id: string;
  severity_score_0_100: number;
  quadrant: 'top_right' | 'top_left' | 'bottom_right' | 'bottom_left';
  components: {
    probability: { value: Risk['probability']; weight: number };
    impact: { value: Risk['impact']; weight: number };
    horizon: { value: Risk['time_horizon']; multiplier: number };
    mitigation: { value: Risk['mitigation_status']; multiplier: number };
  };
  formula: string;
}

const PROB: Record<Risk['probability'], number> = {
  certain: 1.0,
  likely: 0.7,
  possible: 0.4,
  unlikely: 0.15,
};

const IMPACT: Record<Risk['impact'], number> = {
  existential: 1.0,
  major: 0.7,
  moderate: 0.4,
  minor: 0.15,
};

const HORIZON: Record<Risk['time_horizon'], number> = {
  imminent_3_months: 1.2,
  near_term_6_12_months: 1.0,
  medium_term_1_2_years: 0.75,
  long_term_2_plus_years: 0.5,
};

const MITIGATION: Record<Risk['mitigation_status'], number> = {
  none: 1.0,
  planned: 0.85,
  in_progress: 0.65,
  partial: 0.5,
};

function determineQuadrant(
  probability: Risk['probability'],
  impact: Risk['impact'],
): RiskScoreBreakdown['quadrant'] {
  const highProb = probability === 'certain' || probability === 'likely';
  const highImpact = impact === 'existential' || impact === 'major';
  if (highProb && highImpact) return 'top_right';
  if (!highProb && highImpact) return 'top_left';
  if (highProb && !highImpact) return 'bottom_right';
  return 'bottom_left';
}

export function calculateRiskSeverity(risk: Risk): RiskScoreBreakdown {
  const base = PROB[risk.probability] * IMPACT[risk.impact];
  const timeAdjusted = base * HORIZON[risk.time_horizon];
  const final = timeAdjusted * MITIGATION[risk.mitigation_status];

  return {
    risk_id: risk.id,
    severity_score_0_100: Math.round(final * 100),
    quadrant: determineQuadrant(risk.probability, risk.impact),
    components: {
      probability: {
        value: risk.probability,
        weight: PROB[risk.probability],
      },
      impact: { value: risk.impact, weight: IMPACT[risk.impact] },
      horizon: {
        value: risk.time_horizon,
        multiplier: HORIZON[risk.time_horizon],
      },
      mitigation: {
        value: risk.mitigation_status,
        multiplier: MITIGATION[risk.mitigation_status],
      },
    },
    formula: 'prob × impact × horizon × (1 - mitigation_factor)',
  };
}
