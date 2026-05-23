'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

interface CaseOption {
  slug: string;
  label: string;
  subtitle: string;
}

interface Props {
  cases: readonly CaseOption[];
  active: string;
}

export function CaseSwitcher({ cases, active }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function switchCase(slug: string) {
    if (slug === active || pending) return;
    const res = await fetch('/api/case', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ case_id: slug }),
    });
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-1">
      {cases.map((c) => {
        const isActive = c.slug === active;
        return (
          <button
            key={c.slug}
            onClick={() => switchCase(c.slug)}
            disabled={pending}
            className={cn(
              'block w-full rounded-md border px-3 py-2 text-left transition',
              isActive
                ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-200'
                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
              pending && 'opacity-50',
            )}
          >
            <p className="text-sm font-medium">{c.label}</p>
            <p className="font-mono text-[10px] text-zinc-500">{c.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}
