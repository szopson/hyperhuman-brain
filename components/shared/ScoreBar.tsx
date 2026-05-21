import { cn } from '@/lib/utils';

export function ScoreBar({
  value,
  max = 10,
  label,
  variant = 'default',
}: {
  value: number;
  max?: number;
  label?: string;
  variant?: 'default' | 'good' | 'bad';
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    variant === 'good'
      ? 'bg-emerald-500'
      : variant === 'bad'
        ? 'bg-rose-500'
        : pct >= 70
          ? 'bg-emerald-500'
          : pct >= 40
            ? 'bg-amber-500'
            : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          {label}
        </span>
      )}
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-xs text-zinc-300">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
