import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-dvh bg-zinc-50 dark:bg-black px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-mono text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← back
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          problems
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          View placeholder. Content arrives after first extraction + scoring pass.
        </p>
      </div>
    </main>
  );
}
