import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AVAILABLE_CASES } from '@/lib/storage/load-analysis';

export async function POST(req: Request) {
  const { case_id } = (await req.json()) as { case_id?: string };
  if (!case_id || !AVAILABLE_CASES.some((c) => c.slug === case_id)) {
    return NextResponse.json({ error: 'invalid case_id' }, { status: 400 });
  }
  const store = await cookies();
  store.set('case', case_id, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.json({ ok: true, case_id });
}
