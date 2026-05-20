import Link from 'next/link';

const VIEWS: Array<{ slug: string; title: string; blurb: string }> = [
  { slug: 'snapshot', title: 'Company Snapshot', blurb: 'Stan firmy + pułapka średniego rozwoju' },
  { slug: 'problems', title: 'Problem Map', blurb: 'Bottlenecks, pain points, frustracje' },
  { slug: 'processes', title: 'Process Map', blurb: 'Procesy biznesowe + CAVAC-readiness' },
  { slug: 'leakage', title: 'Revenue Leakage', blurb: 'Gdzie ucieka kasa i ile' },
  { slug: 'risks', title: 'Risk Radar', blurb: 'Zagrożenia w czasie' },
  { slug: 'opportunities', title: 'AI Opportunity Ranking', blurb: 'Top plays do wdrożenia' },
  { slug: 'competitive', title: 'Competitive Positioning', blurb: 'Mapa konkurencji' },
  { slug: 'actions', title: 'Action Points', blurb: 'Co zrobić, kto, kiedy' },
  { slug: 'next-step', title: 'Recommended Next Step', blurb: 'Pakiet pierwszego projektu' },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-zinc-50 dark:bg-black px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
            HyperHuman / Company Brain · v0.1
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Diagnostic Console
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Patient Zero:{' '}
            <span className="font-mono text-zinc-900 dark:text-zinc-100">stock-hurt</span>.
            Continuous diagnostic tool dla founderów w pułapce średniego rozwoju.
          </p>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VIEWS.map((v, i) => (
            <li key={v.slug}>
              <Link
                href={`/${v.slug}`}
                className="group block rounded-lg border border-zinc-200 bg-white p-5 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  0{i + 1}
                </p>
                <h2 className="mt-1 text-base font-medium text-zinc-950 dark:text-zinc-50">
                  {v.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{v.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>

        <footer className="mt-16 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800">
          Day 1 setup · navigation only · brak treści w widokach do czasu pierwszej ekstrakcji
        </footer>
      </div>
    </main>
  );
}
