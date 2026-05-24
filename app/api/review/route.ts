import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateEntityStatus, mergeApprovedToAnalysis } from '@/lib/storage/load-pending';

const BodySchema = z.object({
  case_id: z.string().default('stock-hurt'),
  entity_id: z.string(),
  status: z.enum(['approved', 'rejected']),
  reviewer: z.string().default('manager'),
  comment: z.string().nullable().default(null),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = BodySchema.parse(body);
  const queue = updateEntityStatus(
    parsed.case_id,
    parsed.entity_id,
    parsed.status,
    parsed.reviewer,
    parsed.comment,
  );

  let merge: { snapshot?: string; added?: { kind: string; id: string; title: string } | null; reason?: string } | null = null;
  if (parsed.status === 'approved') {
    const result = mergeApprovedToAnalysis(parsed.case_id, parsed.entity_id);
    merge = { snapshot: result.snapshotPath, added: result.added, reason: result.reason };
  }

  return NextResponse.json({ ok: true, entity_count: queue.entities.length, merge });
}
