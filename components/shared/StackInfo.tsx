/**
 * Panel "Co jest pod spodem" — pokazuje czytelnie z czego zbudowany jest mózg.
 * Wstawiany do /review i /eval, żeby na rozmowie nie było pytania "gdzie ta baza".
 */

export function StackInfo() {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-950 p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
        Co jest pod spodem · stack
      </p>

      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Baza danych
          </dt>
          <dd className="mt-1 text-sm text-zinc-200">
            <span className="text-emerald-300">Brak.</span> Mózg to plik{' '}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs">
              analysis-full.json
            </code>{' '}
            walidowany schematem Zod, plus{' '}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs">
              pending-queue.json
            </code>{' '}
            i migawki w{' '}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs">
              outputs/history/
            </code>
            .
          </dd>
          <dd className="mt-1 font-mono text-[10px] text-zinc-500">
            v0.3: Vercel Blob lub Postgres dla trwałości w chmurze
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            RAG / wyszukiwanie semantyczne
          </dt>
          <dd className="mt-1 text-sm text-zinc-200">
            <span className="text-emerald-300">Brak wektorów, brak embeddings.</span>{' '}
            Czat ładuje cały{' '}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs">
              analysis-full.json
            </code>{' '}
            jako ustrukturyzowany kontekst do system promptu Claude.
          </dd>
          <dd className="mt-1 font-mono text-[10px] text-zinc-500">
            Działa dla ~50k tokenów. Powyżej — chunkowanie + vector store
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Ekstrakcja z transkryptu (Phase A)
          </dt>
          <dd className="mt-1 text-sm text-zinc-200">
            <span className="text-zinc-300">Claude Opus 4.7</span> z tool_use + schemat Zod.
            Wymuszone source quotes na każdej encji.
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Ekstrakcja z notatek dziennych (Phase A′)
          </dt>
          <dd className="mt-1 text-sm text-zinc-200">
            <span className="text-zinc-300">Claude Opus 4.7</span> tool_use, klasyfikuje
            entity_type, dosłowny cytat z notatki, auto-match do istniejących encji.
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Scoring
          </dt>
          <dd className="mt-1 text-sm text-zinc-200">
            <span className="text-emerald-300">Deterministyczny TypeScript.</span>{' '}
            Zero wywołań LLM. Formuły{' '}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs">
              freq × sev × strat × emo × cov
            </code>{' '}
            policzone w widoku.
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Frontend
          </dt>
          <dd className="mt-1 text-sm text-zinc-200">
            Next.js 16 (App Router, RSC), Tailwind 4, shadcn/ui, hostowane na Vercel.
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Warstwa agentów
          </dt>
          <dd className="mt-1 text-sm text-zinc-200">
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs">
              npm run mcp
            </code>{' '}
            startuje serwer MCP (stdio) z 5 toolami — mózg dostępny dla Claude Desktop,
            Claude Code i innych agentów.
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Storage w runtime (Vercel)
          </dt>
          <dd className="mt-1 text-sm text-zinc-200">
            System plików Vercel jest{' '}
            <span className="text-amber-300">read-only</span>. Approve→merge pisze do
            in-memory cache w warm Lambda. Lokalnie — zapisuje do pliku.
          </dd>
        </div>
      </dl>
    </section>
  );
}
