'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Props {
  caseSlug: string;
  entityId: string;
}

export function ReviewActions({ caseSlug, entityId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function send(status: 'approved' | 'rejected') {
    setError(null);
    setToast(null);
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ case_id: caseSlug, entity_id: entityId, status }),
    });
    if (!res.ok) {
      setError(`HTTP ${res.status}`);
      return;
    }
    const data = (await res.json()) as {
      merge?: { added?: { kind: string; title: string } | null; reason?: string } | null;
    };
    if (status === 'approved') {
      if (data.merge?.added) {
        setToast(`→ dodano ${data.merge.added.kind}: "${data.merge.added.title.slice(0, 60)}…" do mózgu`);
      } else if (data.merge?.reason) {
        setToast(`approved (${data.merge.reason})`);
      }
    } else {
      setToast('rejected');
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="border-emerald-800/60 text-emerald-300 hover:bg-emerald-950"
        disabled={pending}
        onClick={() => send('approved')}
      >
        Approve → mózg
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-rose-800/60 text-rose-300 hover:bg-rose-950"
        disabled={pending}
        onClick={() => send('rejected')}
      >
        Reject
      </Button>
      {error && <span className="text-xs text-rose-400">{error}</span>}
      {toast && <span className="font-mono text-[11px] text-emerald-300">{toast}</span>}
    </div>
  );
}
