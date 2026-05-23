import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateEntityStatus } from '@/lib/storage/load-pending';

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
  return NextResponse.json({ ok: true, entity_count: queue.entities.length });
}
