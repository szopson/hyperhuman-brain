import Link from 'next/link';
import { loadCaseMeta } from '@/lib/storage/load-analysis';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TABS = [
  { slug: 'snapshot', label: 'Snapshot' },
  { slug: 'problems', label: 'Problems' },
  { slug: 'processes', label: 'Processes' },
  { slug: 'leakage', label: 'Leakage' },
  { slug: 'risks', label: 'Risks' },
  { slug: 'opportunities', label: 'Opportunities' },
  { slug: 'competitive', label: 'Competitive' },
  { slug: 'actions', label: 'Actions' },
  { slug: 'next-step', label: 'Next Step' },
];

export async function AppShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  const meta = await loadCaseMeta();
  let lastUpdatedRel = '—';
  try {
    lastUpdatedRel = formatDistanceToNow(new Date(meta.last_updated_iso), {
      addSuffix: true,
    });
  } catch {}

  return (
    <div className="flex min-h-dvh bg-zinc-950 text-zinc-100">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-925 p-6 lg:block">
        <div className="space-y-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              HyperHuman / Brain
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-50">
              {meta.display_name}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Case id: <span className="font-mono">{meta.case_id}</span>
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Founders
            </p>
            <ul className="mt-2 space-y-1">
              {meta.founders.length === 0 && (
                <li className="text-sm text-zinc-500">— niedostępne —</li>
              )}
              {meta.founders.map((f) => (
                <li key={f} className="text-sm text-zinc-200">
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Pipeline
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              version <span className="font-mono">{meta.pipeline_version}</span>
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              generated <span className="font-mono">{lastUpdatedRel}</span>
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-800/50">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              continuous · refreshed 2 min ago
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <nav className="flex items-center gap-1 overflow-x-auto px-4 py-2">
            {TABS.map((t) => {
              const isActive = t.slug === active;
              return (
                <Link
                  key={t.slug}
                  href={`/${t.slug}`}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-zinc-800 text-zinc-50'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
