import fs from 'node:fs';
import path from 'node:path';
import { PendingQueueSchema, type PendingQueue, type ReviewStatus } from '@/lib/schemas';

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
