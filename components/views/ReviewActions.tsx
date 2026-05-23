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

  async function send(status: 'approved' | 'rejected') {
    setError(null);
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ case_id: caseSlug, entity_id: entityId, status }),
    });
    if (!res.ok) {
      setError(`HTTP ${res.status}`);
      return;
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
    </div>
  );
}
