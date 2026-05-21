import type { Pain, Metric } from '@/lib/schemas';

export interface LeakageScoreBreakdown {
  pain_id: string;
  estimated_monthly_leak_pln: number;
  recoverability_rate: number;
  recoverable_monthly_pln: number;
  confidence: 'high' | 'medium' | 'low';
  score_0_100: number;
  assumptions_used: string[];
  sensitivity_range: [number, number];
}

const RECOVERABILITY: Record<Pain['category'], number> = {
  time_waste: 0.7,
  manual_repetitive_work: 0.8,
  knowledge_silos: 0.5,
  lost_context: 0.4,
  data_quality: 0.6,
  communication_breakdown: 0.45,
  tooling_friction: 0.55,
  lost_revenue: 0.3,
  customer_experience: 0.35,
  compliance_risk: 0.6,
  scaling_blocker: 0.5,
};

const SEV_MONEY_BASELINE_PLN: Record<Pain['severity'], number> = {
  critical: 50_000,
  high: 20_000,
  medium: 8_000,
  low: 2_000,
};

const FREQ_AMPLIFIER: Record<Pain['frequency'], number> = {
  constant: 1.3,
  daily: 1.0,
  weekly: 0.6,
  monthly: 0.35,
  occasional: 0.15,
};

function parseNumber(value: Metric['current_value']): number | null {
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/[^\d.]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Sanity upper bound on what we'd ever attribute to a single pain monthly (PLN).
const MAX_MONTHLY_LEAK_PLN = 500_000;

function isHoursUnit(unit: string): boolean {
  const u = unit.toLowerCase();
  return /^h\b|godzin|hour/.test(u);
}

function isMoneyMetric(m: Metric): boolean {
  if (m.category === 'money') return true;
  const u = m.unit.toUpperCase();
  return u === 'PLN' || u === 'EUR' || u === 'USD';
}

function estimateLeakageFromMetrics(
  associatedMetrics: Metric[],
  pain: Pain,
): { value: number; assumptions: string[] } {
  const assumptions: string[] = [];
  const sevBase = SEV_MONEY_BASELINE_PLN[pain.severity];
  const freqAmp = FREQ_AMPLIFIER[pain.frequency];
  const baseline = sevBase * freqAmp;

  if (associatedMetrics.length === 0) {
    assumptions.push(
      `Brak metryk powiązanych z procesami pain — bazowy estymat z severity=${pain.severity} (${sevBase} PLN) × freq=${pain.frequency} (${freqAmp}×)`,
    );
    return { value: Math.min(baseline, MAX_MONTHLY_LEAK_PLN), assumptions };
  }

  // Only treat metric as "hours leak" if unit explicitly looks like hours.
  const timeMetric = associatedMetrics.find(
    (m) => m.category === 'time' && isHoursUnit(m.unit),
  );
  if (timeMetric) {
    const hours = parseNumber(timeMetric.current_value);
    if (hours != null && hours > 0 && hours < 10_000) {
      const HOURLY_RATE_PLN = 80;
      const monthly = hours * HOURLY_RATE_PLN;
      assumptions.push(
        `Metric "${timeMetric.name}"=${hours}${timeMetric.unit} × ${HOURLY_RATE_PLN} PLN/h burdened`,
      );
      return { value: Math.min(monthly, MAX_MONTHLY_LEAK_PLN), assumptions };
    }
  }

  // Money metric: only treat as leak if period suggests recurring loss (not revenue baseline).
  // Conservative: cap contribution at 10% of metric value to avoid treating revenue as leak.
  const moneyMetric = associatedMetrics.find((m) => isMoneyMetric(m));
  if (moneyMetric) {
    const m = parseNumber(moneyMetric.current_value);
    if (m != null && m > 0) {
      const conservative = m * 0.1;
      assumptions.push(
        `Metric "${moneyMetric.name}"=${m} ${moneyMetric.unit} × 10% conservative leak attribution (avoiding revenue-as-leak conflation)`,
      );
      return {
        value: Math.min(Math.max(conservative, baseline), MAX_MONTHLY_LEAK_PLN),
        assumptions,
      };
    }
  }

  assumptions.push(
    `Metryki powiązane (${associatedMetrics.length}) bez wiarygodnych liczb — fallback do severity/freq baseline`,
  );
  return { value: Math.min(baseline, MAX_MONTHLY_LEAK_PLN), assumptions };
}

function scaleLeakageToScore(recoverableMonthly: number): number {
  if (recoverableMonthly <= 0) return 0;
  const score = Math.min(100, Math.round(20 * Math.log10(recoverableMonthly + 1)));
  return Math.max(0, score);
}

export function calculateLeakageScore(
  pain: Pain,
  metrics: Metric[],
): LeakageScoreBreakdown {
  const associatedMetrics = metrics.filter((m) =>
    pain.affected_processes.some((p) => m.related_processes.includes(p)),
  );

  const { value: estimatedMonthlyLeak, assumptions } = estimateLeakageFromMetrics(
    associatedMetrics,
    pain,
  );

  const recoverabilityRate = RECOVERABILITY[pain.category] ?? 0.4;
  const recoverableMonthly = estimatedMonthlyLeak * recoverabilityRate;

  const confidence: LeakageScoreBreakdown['confidence'] =
    associatedMetrics.length >= 2
      ? 'medium'
      : associatedMetrics.length === 1
        ? 'low'
        : 'low';

  return {
    pain_id: pain.id,
    estimated_monthly_leak_pln: Math.round(estimatedMonthlyLeak),
    recoverability_rate: recoverabilityRate,
    recoverable_monthly_pln: Math.round(recoverableMonthly),
    confidence,
    score_0_100: scaleLeakageToScore(recoverableMonthly),
    assumptions_used: assumptions,
    sensitivity_range: [
      Math.round(recoverableMonthly * 0.5),
      Math.round(recoverableMonthly * 1.5),
    ],
  };
}
