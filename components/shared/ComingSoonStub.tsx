import { AppShell } from '@/components/layout/AppShell';

export function ComingSoonStub({
  slug,
  title,
  blurb,
}: {
  slug: string;
  title: string;
  blurb: string;
}) {
  return (
    <AppShell active={slug}>
      <div className="mx-auto max-w-3xl py-16">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Coming Day 4
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
          {title}
        </h1>
        <p className="mt-4 text-zinc-400">{blurb}</p>
        <div className="mt-8 rounded-md border border-dashed border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-500">
          Widok zaplanowany w Day 4 polish pass. Dane są już dostępne w
          <code className="mx-1 font-mono text-zinc-300">analysis-full.json</code>
          — UI dochodzi w następnej iteracji.
        </div>
      </div>
    </AppShell>
  );
}
