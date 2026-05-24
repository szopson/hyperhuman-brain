import fs from 'node:fs';
import path from 'node:path';
import {
  CompanyAnalysisSchema,
  PendingQueueSchema,
  type CompanyAnalysis,
  type PendingEntity,
} from '@/lib/schemas';
import { computeAllScores } from '@/lib/scoring';

export interface SchemaCheck {
  file: string;
  status: 'pass' | 'fail' | 'missing';
  error?: string;
}

export interface CoverageMetric {
  total: number;
  withQuotes: number;
  withHighConfQuotes: number;
  coveragePct: number;
}

export interface QualityReport {
  caseSlug: string;
  schema: SchemaCheck[];
  pains: CoverageMetric;
  risks: CoverageMetric;
  processes: CoverageMetric;
  scoring: {
    distribution: { bucket: string; count: number }[];
    saturated_100: number;
    median: number;
  };
  pending: {
    total: number;
    pending: number;
    approved_7d: number;
    rejected_7d: number;
    approval_ratio: number | null;
  };
  extractionFidelity: {
    llmExtracted: number;
    quoteLiteralInRaw: number;
    fidelityPct: number | null;
  };
  history: {
    snapshots: number;
    latestIso: string | null;
  };
}

function casePath(caseSlug: string, ...rest: string[]): string {
  return path.join(process.cwd(), 'data/cases', caseSlug, ...rest);
}

function checkSchema(filePath: string, schema: typeof CompanyAnalysisSchema | typeof PendingQueueSchema): SchemaCheck {
  if (!fs.existsSync(filePath)) return { file: path.basename(filePath), status: 'missing' };
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    schema.parse(raw);
    return { file: path.basename(filePath), status: 'pass' };
  } catch (e) {
    return { file: path.basename(filePath), status: 'fail', error: (e as Error).message.slice(0, 200) };
  }
}

function coverage<T extends { source_quotes: { confidence: string }[] }>(items: T[]): CoverageMetric {
  const total = items.length;
  const withQuotes = items.filter((i) => i.source_quotes.length > 0).length;
  const withHighConfQuotes = items.filter((i) => i.source_quotes.some((q) => q.confidence === 'high')).length;
  return {
    total,
    withQuotes,
    withHighConfQuotes,
    coveragePct: total === 0 ? 100 : Math.round((withQuotes / total) * 100),
  };
}

function distributionBuckets(scores: number[]): { bucket: string; count: number }[] {
  const buckets = [
    { bucket: '0–25', min: 0, max: 25 },
    { bucket: '25–50', min: 25, max: 50 },
    { bucket: '50–75', min: 50, max: 75 },
    { bucket: '75–99', min: 75, max: 100 },
    { bucket: '100 (clamped)', min: 100, max: 101 },
  ];
  return buckets.map((b) => ({
    bucket: b.bucket,
    count: scores.filter((s) => s >= b.min && s < b.max).length,
  }));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function extractionFidelity(entities: PendingEntity[]) {
  const llm = entities.filter((e) => {
    const p = e.payload as { llm_extracted?: boolean };
    return p?.llm_extracted === true;
  });
  const fidelityHits = llm.filter((e) => {
    const p = e.payload as { source_quote?: string };
    if (!p?.source_quote) return false;
    return e.raw_input.includes(p.source_quote.trim().slice(0, 60));
  });
  return {
    llmExtracted: llm.length,
    quoteLiteralInRaw: fidelityHits.length,
    fidelityPct: llm.length === 0 ? null : Math.round((fidelityHits.length / llm.length) * 100),
  };
}

export function computeQualityReport(caseSlug: string): QualityReport {
  const analysisP = casePath(caseSlug, 'outputs/analysis-full.json');
  const queueP = casePath(caseSlug, 'outputs/pending-queue.json');
  const schema: SchemaCheck[] = [
    checkSchema(analysisP, CompanyAnalysisSchema),
    checkSchema(queueP, PendingQueueSchema),
  ];

  let analysis: CompanyAnalysis | null = null;
  if (schema[0].status === 'pass') {
    analysis = CompanyAnalysisSchema.parse(JSON.parse(fs.readFileSync(analysisP, 'utf8')));
  }

  let pending: PendingEntity[] = [];
  if (schema[1].status === 'pass') {
    pending = PendingQueueSchema.parse(JSON.parse(fs.readFileSync(queueP, 'utf8'))).entities;
  }

  const painsCov = analysis ? coverage(analysis.pains) : { total: 0, withQuotes: 0, withHighConfQuotes: 0, coveragePct: 100 };
  const risksCov = analysis ? coverage(analysis.risks) : { total: 0, withQuotes: 0, withHighConfQuotes: 0, coveragePct: 100 };
  const procsCov = analysis ? coverage(analysis.processes) : { total: 0, withQuotes: 0, withHighConfQuotes: 0, coveragePct: 100 };

  let distribution: { bucket: string; count: number }[] = [];
  let saturated_100 = 0;
  let medianScore = 0;
  if (analysis) {
    const { problem_scores } = computeAllScores(analysis);
    const scores = [...problem_scores.values()].map((b) => b.final_score_0_100);
    distribution = distributionBuckets(scores);
    saturated_100 = scores.filter((s) => s === 100).length;
    medianScore = median(scores);
  }

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const approved7d = pending.filter(
    (e) => e.review.status === 'approved' && e.review.reviewed_at && Date.now() - new Date(e.review.reviewed_at).getTime() < weekMs,
  ).length;
  const rejected7d = pending.filter(
    (e) => e.review.status === 'rejected' && e.review.reviewed_at && Date.now() - new Date(e.review.reviewed_at).getTime() < weekMs,
  ).length;
  const pendingCount = pending.filter((e) => e.review.status === 'pending').length;
  const decided = approved7d + rejected7d;

  const historyDir = casePath(caseSlug, 'outputs/history');
  let snapshots = 0;
  let latestIso: string | null = null;
  if (fs.existsSync(historyDir)) {
    const files = fs.readdirSync(historyDir).filter((f) => f.endsWith('.json')).sort();
    snapshots = files.length;
    if (files.length > 0) {
      const stem = files[files.length - 1].replace(/\.json$/, '');
      latestIso = stem.replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3}Z)$/, '$1:$2:$3.$4');
    }
  }

  return {
    caseSlug,
    schema,
    pains: painsCov,
    risks: risksCov,
    processes: procsCov,
    scoring: { distribution, saturated_100, median: medianScore },
    pending: {
      total: pending.length,
      pending: pendingCount,
      approved_7d: approved7d,
      rejected_7d: rejected7d,
      approval_ratio: decided === 0 ? null : Math.round((approved7d / decided) * 100),
    },
    extractionFidelity: extractionFidelity(pending),
    history: { snapshots, latestIso },
  };
}
