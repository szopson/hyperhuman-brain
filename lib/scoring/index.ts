import type { CompanyAnalysis } from '@/lib/schemas';
import { calculateProblemScore, type ProblemScoreBreakdown } from './problem-score';
import { calculateLeakageScore, type LeakageScoreBreakdown } from './leakage-score';
import { calculateRiskSeverity, type RiskScoreBreakdown } from './risk-severity-score';

export * from './problem-score';
export * from './leakage-score';
export * from './risk-severity-score';
export * from './ai-opportunity-score';

export interface AllScores {
  problem_scores: Map<string, ProblemScoreBreakdown>;
  leakage_scores: Map<string, LeakageScoreBreakdown>;
  risk_scores: Map<string, RiskScoreBreakdown>;
}

export function computeAllScores(analysis: CompanyAnalysis): AllScores {
  const problem_scores = new Map<string, ProblemScoreBreakdown>();
  for (const pain of analysis.pains) {
    problem_scores.set(pain.id, calculateProblemScore(pain));
  }

  const leakage_scores = new Map<string, LeakageScoreBreakdown>();
  for (const pain of analysis.pains) {
    leakage_scores.set(pain.id, calculateLeakageScore(pain, analysis.metrics));
  }

  const risk_scores = new Map<string, RiskScoreBreakdown>();
  for (const risk of analysis.risks) {
    risk_scores.set(risk.id, calculateRiskSeverity(risk));
  }

  return { problem_scores, leakage_scores, risk_scores };
}
