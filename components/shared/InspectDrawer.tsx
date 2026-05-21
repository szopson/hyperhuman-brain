'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SourceQuote } from '@/lib/schemas';

interface ScoreMath {
  formula: string;
  components: Record<string, unknown>;
  final_score_0_100: number;
}

export interface InspectPayload {
  title: string;
  subtitle?: string;
  quotes: SourceQuote[];
  scoreMath?: ScoreMath;
  extra?: Array<{ label: string; value: string | number }>;
}

const CONFIDENCE_COLOR: Record<SourceQuote['confidence'], string> = {
  high: 'bg-emerald-900/40 text-emerald-300 ring-emerald-700/50',
  medium: 'bg-amber-900/40 text-amber-300 ring-amber-700/50',
  low: 'bg-rose-900/40 text-rose-300 ring-rose-700/50',
};

const CONFIDENCE_LABEL: Record<SourceQuote['confidence'], string> = {
  high: 'wysoka',
  medium: 'średnia',
  low: 'niska',
};

export function InspectTrigger({
  payload,
  children,
  className,
}: {
  payload: InspectPayload;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-inspect-trigger
        onClick={() => setOpen(true)}
        className={cn(
          'group cursor-pointer text-left',
          'underline decoration-zinc-700 decoration-dotted underline-offset-4',
          'hover:decoration-zinc-400 hover:text-zinc-50',
          className,
        )}
      >
        {children}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl bg-zinc-950 border-zinc-800 text-zinc-100 overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-zinc-50">{payload.title}</SheetTitle>
            {payload.subtitle && (
              <SheetDescription className="text-zinc-400">
                {payload.subtitle}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="space-y-6 px-4 pb-8">
            {payload.scoreMath && (
              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Jak liczona jest ocena
                </h3>
                <div className="mt-2 rounded-md border border-zinc-800 bg-zinc-900 p-3">
                  <p className="text-sm text-zinc-300">
                    Ocena końcowa:{' '}
                    <span className="font-mono text-zinc-50">
                      {payload.scoreMath.final_score_0_100}
                    </span>
                    <span className="text-zinc-500"> / 100</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Wzór:{' '}
                    <span className="font-mono text-zinc-400">
                      {payload.scoreMath.formula}
                    </span>
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded bg-zinc-950 p-2 text-[11px] leading-relaxed text-zinc-300">
                    {JSON.stringify(payload.scoreMath.components, null, 2)}
                  </pre>
                </div>
              </section>
            )}

            {payload.extra && payload.extra.length > 0 && (
              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Szczegóły
                </h3>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {payload.extra.map((e) => (
                    <div key={e.label} className="contents">
                      <dt className="text-zinc-500">{e.label}</dt>
                      <dd className="text-zinc-200 font-mono">{e.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Skąd to wiemy ({payload.quotes.length})
              </h3>
              {payload.quotes.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">
                  Brak źródeł dla tego elementu.
                </p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {payload.quotes.map((q, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-zinc-800 bg-zinc-900 p-3"
                    >
                      <p className="text-sm text-zinc-200">
                        &ldquo;{q.text}&rdquo;
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        <Badge
                          variant="outline"
                          className={cn(
                            'border-0 ring-1',
                            CONFIDENCE_COLOR[q.confidence],
                          )}
                        >
                          Pewność: {CONFIDENCE_LABEL[q.confidence]}
                        </Badge>
                        {q.speaker && (
                          <span className="text-zinc-500">
                            mówca:{' '}
                            <span className="text-zinc-300">{q.speaker}</span>
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
