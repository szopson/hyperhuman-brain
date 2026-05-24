import Link from 'next/link';
import { loadCaseMeta, AVAILABLE_CASES, currentCaseSlug } from '@/lib/storage/load-analysis';
import { CaseSwitcher } from '@/components/layout/CaseSwitcher';
import { cn } from '@/lib/utils';

const TABS = [
  { slug: 'snapshot', label: 'Stan firmy' },
  { slug: 'problems', label: 'Gdzie boli' },
  { slug: 'processes', label: 'Mapa procesów' },
  { slug: 'leakage', label: 'Gdzie uciekają pieniądze' },
  { slug: 'risks', label: 'Ryzyka strategiczne' },
  { slug: 'opportunities', label: 'Co warto wdrożyć' },
  { slug: 'competitive', label: 'Pozycja na rynku' },
  { slug: 'actions', label: 'Plan działania' },
  { slug: 'next-step', label: 'Nasza propozycja' },
  { slug: 'review', label: 'Kolejka review', v: '0.2' },
  { slug: 'chat', label: 'Czat z mózgiem', v: '0.2' },
  { slug: 'eval', label: 'Telemetria', v: '0.2' },
  { slug: 'architecture', label: 'Dalsza architektura', v: '0.2' },
];

export async function AppShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  const meta = await loadCaseMeta();
  const activeCase = await currentCaseSlug();

  return (
    <div className="flex min-h-dvh bg-zinc-950 text-zinc-100">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-925 p-6 lg:block">
        <div className="space-y-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              HyperHuman × {meta.display_name}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-50">
              {meta.display_name}
            </h2>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Case
            </p>
            <div className="mt-2">
              <CaseSwitcher cases={AVAILABLE_CASES} active={activeCase} />
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Founderzy
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
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-zinc-800 text-zinc-50'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
                  )}
                >
                  {t.label}
                  {t.v && (
                    <span className="rounded bg-emerald-900/40 px-1 font-mono text-[9px] tracking-wide text-emerald-300">
                      v{t.v}
                    </span>
                  )}
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
