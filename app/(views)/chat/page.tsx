import { AppShell } from '@/components/layout/AppShell';
import { ChatPanel } from '@/components/views/ChatPanel';
import { buildBrainContext } from '@/lib/chat/build-context';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { chunks } = await buildBrainContext();
  const counts = chunks.reduce<Record<string, number>>((acc, c) => {
    acc[c.kind] = (acc[c.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell active="chat">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            11 · Czat z mózgiem firmy · v0.2
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            Pytaj. Odpowiadam tylko z cytatów.
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Interfejs dla mniej technicznych pracowników. Każda odpowiedź jest
            zbudowana wyłącznie z encji w mózgu (painy, ryzyka, procesy, plays)
            i cytuje konkretny chunk ID — tak jak inspect drawer w dashboardzie,
            tylko w formacie czatu.
          </p>
          <p className="mt-3 font-mono text-[11px] text-zinc-500">
            kontekst: {chunks.length} chunks
            {Object.entries(counts).map(([k, v]) => ` · ${k}=${v}`).join('')}
          </p>
        </header>

        <ChatPanel />

        <section className="rounded-md border border-dashed border-zinc-800 bg-zinc-900/30 p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Dlaczego nie zwykły LLM
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            System prompt wymusza: (1) odpowiedź wyłącznie z dostarczonych cytatów,
            (2) inline reference do chunk ID po każdym twierdzeniu, (3) eksplicytne
            &bdquo;nie mam tej informacji&rdquo; gdy kontekst nie pokrywa pytania. To ten sam
            anty-halucynacyjny kontrakt co reszta produktu — tylko że teraz dostępny
            dla zespołu klienta w naturalnym dla nich formacie.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
