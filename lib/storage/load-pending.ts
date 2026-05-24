import fs from 'node:fs';
import path from 'node:path';
import {
  PendingQueueSchema,
  CompanyAnalysisSchema,
  type PendingQueue,
  type PendingEntity,
  type ReviewStatus,
  type CompanyAnalysis,
  type Pain,
  type Risk,
  type SourceQuote,
} from '@/lib/schemas';

function queuePath(caseSlug: string): string {
  return path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/pending-queue.json');
}

export function loadPendingQueue(caseSlug = 'stock-hurt'): PendingQueue {
  const p = queuePath(caseSlug);
  if (!fs.existsSync(p)) {
    return { case_id: caseSlug, generated_at: new Date().toISOString(), entities: [] };
  }
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  return PendingQueueSchema.parse(raw);
}

export function updateEntityStatus(
  caseSlug: string,
  entityId: string,
  status: ReviewStatus,
  reviewer: string,
  comment: string | null,
): PendingQueue {
  const queue = loadPendingQueue(caseSlug);
  const ent = queue.entities.find((e) => e.id === entityId);
  if (!ent) throw new Error(`Entity ${entityId} not found`);
  ent.review = {
    status,
    reviewed_by: reviewer,
    reviewed_at: new Date().toISOString(),
    review_comment: comment,
  };
  queue.generated_at = new Date().toISOString();
  fs.writeFileSync(queuePath(caseSlug), JSON.stringify(queue, null, 2));
  return queue;
}

// ============= V0.2 SPRINT 3: AUTO-MERGE TO BRAIN =============

function analysisPath(caseSlug: string): string {
  return path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/analysis-full.json');
}

function historyDir(caseSlug: string): string {
  return path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/history');
}

function snapshotAnalysis(caseSlug: string, analysis: CompanyAnalysis): string {
  const dir = historyDir(caseSlug);
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapPath = path.join(dir, `${stamp}.json`);
  fs.writeFileSync(snapPath, JSON.stringify(analysis, null, 2));
  return snapPath;
}

function buildSourceQuote(ent: PendingEntity): SourceQuote {
  const payload = ent.payload as { source_quote?: string; confidence?: 'high' | 'medium' | 'low' };
  const quoteText =
    typeof payload?.source_quote === 'string' && payload.source_quote.trim()
      ? payload.source_quote
      : ent.raw_input.slice(0, 200);
  return {
    text: quoteText.slice(0, 240),
    source: 'transcript',
    speaker: ent.author_id,
    timestamp: null,
    confidence: payload?.confidence ?? 'medium',
    source_role: ent.author_role,
    source_type: ent.source_type,
    author_id: ent.author_id,
    ingested_at: ent.ingested_at,
  };
}

function inferPainCategory(title: string): Pain['category'] {
  const t = title.toLowerCase();
  if (/(czas|tracę|godzin|min )/.test(t)) return 'time_waste';
  if (/(ręczn|manualn|powtarz)/.test(t)) return 'manual_repetitive_work';
  if (/(sync|integr|narzędzi|tool|wms|crm|allegro)/.test(t)) return 'tooling_friction';
  if (/(klient|customer|deal|oferta)/.test(t)) return 'customer_experience';
  if (/(kontekst|pamięta|gubi)/.test(t)) return 'lost_context';
  if (/(jakość danych|błąd|niezgod)/.test(t)) return 'data_quality';
  if (/(skal|wzrost|blok)/.test(t)) return 'scaling_blocker';
  return 'lost_context';
}

interface MergeResult {
  snapshotPath: string;
  added: { kind: string; id: string; title: string } | null;
  reason?: string;
}

export function mergeApprovedToAnalysis(caseSlug: string, entityId: string): MergeResult {
  const queue = loadPendingQueue(caseSlug);
  const ent = queue.entities.find((e) => e.id === entityId);
  if (!ent) throw new Error(`Entity ${entityId} not found`);
  if (ent.review.status !== 'approved') {
    return { snapshotPath: '', added: null, reason: 'not approved' };
  }

  const analysisP = analysisPath(caseSlug);
  if (!fs.existsSync(analysisP)) {
    return { snapshotPath: '', added: null, reason: 'no analysis-full.json' };
  }
  const raw = JSON.parse(fs.readFileSync(analysisP, 'utf8'));
  const analysis = CompanyAnalysisSchema.parse(raw);

  const snapshotPath = snapshotAnalysis(caseSlug, analysis);

  const payload = ent.payload as { title?: string; description?: string };
  const title = payload?.title ?? ent.raw_input.split('\n')[0].slice(0, 120);
  const description = payload?.description ?? ent.raw_input;
  const newId = `${ent.entity_type === 'risk' ? 'risk' : 'pain'}-merged-${entityId.replace(/^pending-/, '')}`;

  let added: MergeResult['added'] = null;

  if (ent.entity_type === 'pain') {
    if (analysis.pains.some((p) => p.id === newId)) {
      return { snapshotPath, added: null, reason: 'already merged' };
    }
    const pain: Pain = {
      id: newId,
      title,
      description,
      category: inferPainCategory(title),
      affected_processes: ent.related_entity_ids.filter((id) => analysis.processes.some((p) => p.id === id)),
      affected_roles: [ent.author_role === 'employee' ? ent.author_id : 'Founder'],
      frequency: 'weekly',
      severity: 'medium',
      strategic_impact: 'moderate',
      founder_emotional_intensity: ent.author_role === 'founder' ? 'frustrating' : 'mentioned',
      founder_quoted_phrase: null,
      source_quotes: [buildSourceQuote(ent)],
      review: {
        status: 'approved',
        reviewed_by: ent.review.reviewed_by,
        reviewed_at: ent.review.reviewed_at,
        review_comment: ent.review.review_comment,
      },
    };
    analysis.pains.push(pain);
    added = { kind: 'pain', id: pain.id, title: pain.title };
  } else if (ent.entity_type === 'risk') {
    if (analysis.risks.some((r) => r.id === newId)) {
      return { snapshotPath, added: null, reason: 'already merged' };
    }
    const risk: Risk = {
      id: newId,
      title,
      category: 'operational',
      description,
      time_horizon: 'near_term_6_12_months',
      probability: 'possible',
      impact: 'moderate',
      specific_actors: null,
      mitigation_status: 'none',
      source_quotes: [buildSourceQuote(ent)],
      review: {
        status: 'approved',
        reviewed_by: ent.review.reviewed_by,
        reviewed_at: ent.review.reviewed_at,
        review_comment: ent.review.review_comment,
      },
    };
    analysis.risks.push(risk);
    added = { kind: 'risk', id: risk.id, title: risk.title };
  } else {
    // process_update / metric / observation — record as followup_question
    analysis.followup_questions = [
      ...analysis.followup_questions,
      `[${ent.entity_type} z ${ent.author_id}] ${title}`,
    ];
    added = { kind: ent.entity_type, id: ent.id, title };
  }

  analysis.last_continuous_refresh = new Date().toISOString();
  fs.writeFileSync(analysisP, JSON.stringify(analysis, null, 2));

  return { snapshotPath, added };
}
