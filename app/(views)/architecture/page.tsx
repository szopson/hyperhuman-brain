import { AppShell } from '@/components/layout/AppShell';
import { MermaidDiagram } from '@/components/shared/MermaidDiagram';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ARCHITECTURE_CHART = `
flowchart TB
    subgraph IN["WEJŚCIE · jak wiedza wpada do mózgu"]
        direction TB
        I1[Rozmowa foundera<br/>Whisper transkrypt]
        I2[Notatki głosowe<br/>pracowników]
        I3[Formularze webowe<br/>pracowników]
        I4[Konektory<br/>Slack · Email · GDrive<br/>WhatsApp · Allegro · CRM]
        EXT[Phase A / A'<br/>Claude Opus 4.7<br/>tool_use + Zod schema<br/>wymuszone source quotes]
        REV[Kolejka review<br/>human-in-the-loop<br/>approve / reject]
        I1 --> EXT
        I2 --> EXT
        I3 --> EXT
        I4 --> EXT
        EXT --> REV
    end

    subgraph CORE["RDZEŃ · single source of truth"]
        DB[(Postgres + Drizzle ORM<br/>schemat Zod = jedyne źródło typów<br/>cases · pains · risks · processes<br/>plays · pending · source_quotes<br/>audit_log · scoring_history)]
        SCORE[Scoring engine<br/>deterministyczny TS<br/>zero LLM]
        PLAYS[Plays library<br/>21+ plays curated<br/>CAVAC + constraint selektor]
        API[Brain API<br/>Next.js RSC + MCP server]
        DB --> SCORE
        DB --> PLAYS
        SCORE --> API
        PLAYS --> API
    end

    subgraph OUT["WYJŚCIE · dla kogo i jak"]
        O1[Panel<br/>founder + konsultant<br/>9 widoków diagnostycznych]
        O2[Czat<br/>zespół klienta<br/>inline citations]
        O3[Briefing<br/>founder daily/weekly<br/>markdown + TTS audio]
        O4[Serwer MCP<br/>Claude Desktop · Claude Code<br/>5+ toolów dla agentów]
        O5[Eksporty<br/>JSON · PDF · Notion · Linear]
    end

    subgraph OBS["OBSERWACJA · niezależna warstwa kontroli"]
        OB1[/eval telemetria<br/>coverage · fidelity · velocity<br/>cost per case]
        OB2[Audit log<br/>kto · kiedy · dlaczego]
        OB3[History snapshots<br/>time-travel mózgu]
    end

    REV -->|tylko approved| DB
    API --> O1
    API --> O2
    API --> O3
    API --> O4
    API --> O5
    DB -.->|read-only| OBS

    classDef done fill:#064e3b,stroke:#10b981,color:#d1fae5
    classDef todo fill:#1c1917,stroke:#71717a,color:#e7e5e4
    classDef center fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff

    class EXT,REV,SCORE,PLAYS,API,O1,O2,O3,O4,OB1,OB2,OB3 done
    class I2,I3,I4,DB,O5 todo
    class API center
`;

interface StackRow {
  layer: string;
  tech: string;
  status: 'done' | 'partial' | 'todo';
  note?: string;
}

const STACK: StackRow[] = [
  { layer: 'Frontend', tech: 'Next.js 16 App Router + RSC, Tailwind 4, shadcn/ui', status: 'done' },
  { layer: 'Hosting', tech: 'Vercel · Fluid Compute', status: 'done' },
  { layer: 'LLM ekstrakcja', tech: 'Claude Opus 4.7 + tool_use + Zod schema', status: 'done' },
  { layer: 'LLM czat', tech: 'Claude Opus 4.7 + ustrukturyzowany kontekst', status: 'done' },
  { layer: 'Walidacja typów', tech: 'Zod (jeden schemat od UI po bazę)', status: 'done' },
  { layer: 'Scoring', tech: 'TypeScript deterministyczny, zero LLM', status: 'done' },
  { layer: 'Plays library', tech: '21 plays z metadanymi CAVAC + selektor', status: 'done' },
  { layer: 'Bramka human-in-the-loop', tech: 'Kolejka review + approve / reject', status: 'done' },
  { layer: 'Auto-merge → mózg', tech: 'Snapshot history + audit trail', status: 'done' },
  { layer: 'Telemetria', tech: '/eval z coverage, fidelity, distribution', status: 'done' },
  { layer: 'Serwer MCP', tech: 'stdio transport, 5 toolów', status: 'done' },
  { layer: 'Storage runtime', tech: 'JSON + in-memory cache (Vercel)', status: 'partial', note: 'v0.3 → Postgres' },
  { layer: 'Baza danych', tech: 'Postgres + Drizzle ORM (te same typy z Zod)', status: 'todo', note: 'v0.3' },
  { layer: 'Trwały storage', tech: 'Vercel Blob dla raw audio / transkryptów', status: 'todo', note: 'v0.3' },
  { layer: 'Voice in', tech: 'Whisper API dla notatek głosowych', status: 'todo', note: 'v0.3' },
  { layer: 'Voice out (briefing)', tech: 'OpenAI TTS lub ElevenLabs', status: 'todo', note: 'v0.4' },
  { layer: 'Konektory ingestion', tech: 'Slack / Email / GDrive / WhatsApp / Allegro', status: 'todo', note: 'v0.4-0.5' },
  { layer: 'Auth + multi-tenant', tech: 'Clerk + per-case permissions', status: 'todo', note: 'v0.4' },
  { layer: 'Cron + ciągłe odświeżanie', tech: 'Vercel Cron + Phase A′ batch', status: 'todo', note: 'v0.4' },
  { layer: 'Cost tracking', tech: 'OpenTelemetry + Anthropic usage API', status: 'todo', note: 'v0.3' },
  { layer: 'MCP po HTTP', tech: 'Endpoint dla agentów partnerskich', status: 'todo', note: 'v0.5' },
  { layer: 'Eksport dwukierunkowy', tech: 'Notion / Linear sync action points', status: 'todo', note: 'v0.5' },
];

const STATUS_COLOR: Record<StackRow['status'], string> = {
  done: 'bg-emerald-900/40 text-emerald-200 ring-emerald-800',
  partial: 'bg-amber-900/40 text-amber-200 ring-amber-800',
  todo: 'bg-zinc-800 text-zinc-400 ring-zinc-700',
};

const STATUS_LABEL: Record<StackRow['status'], string> = {
  done: 'gotowe',
  partial: 'częściowo',
  todo: 'roadmapa',
};

export default function Page() {
  const doneCount = STACK.filter((r) => r.status === 'done').length;
  const partialCount = STACK.filter((r) => r.status === 'partial').length;
  const todoCount = STACK.filter((r) => r.status === 'todo').length;

  return (
    <AppShell active="architecture">
      <div className="mx-auto max-w-6xl space-y-10">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            13 · Docelowa architektura · v0.2 → v1.0
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            Mózg firmy — gdzie to jedzie
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Trzy warstwy plus niezależna obserwacja. Co już działa, co dorzucam w v0.3-v0.5,
            i trzy zasady architektoniczne które trzymają wszystko razem.
          </p>
          <p className="mt-3 font-mono text-[11px] text-zinc-500">
            {doneCount} komponentów gotowe · {partialCount} częściowo · {todoCount} w roadmapie
          </p>
        </header>

        {/* DIAGRAM */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Diagram · wejście → rdzeń → wyjście + obserwacja
          </h2>
          <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950 p-6">
            <MermaidDiagram chart={ARCHITECTURE_CHART} id="arch" />
          </div>
          <p className="mt-2 font-mono text-[10px] text-zinc-500">
            <span className="inline-block h-2 w-2 rounded-sm bg-emerald-700 align-middle" /> zielone · gotowe ·{' '}
            <span className="inline-block h-2 w-2 rounded-sm bg-zinc-700 align-middle" /> szare · roadmapa v0.3+
          </p>
        </section>

        {/* TRZY ZASADY */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Trzy zasady · które trzymają wszystko razem
          </h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <PrincipleCard
              num="1"
              title="Jeden schemat od wejścia po bazę"
              body="Zod definiuje encje raz. Ten sam schemat waliduje wyjście LLM przy ekstrakcji, generuje typy bazy przez Drizzle, waliduje payload API, typuje komponenty React."
              consequence="Dodanie pola w jednym miejscu propaguje się przez cały stack. Zero dryftu między warstwami."
            />
            <PrincipleCard
              num="2"
              title="Każda liczba musi mieć cytat"
              body="Twardy kontrakt CI. Encja bez source_quotes jest odrzucana przez Zod, nigdy nie ląduje w mózgu. Każda liczba w UI jest klikalna i prowadzi do dosłownego cytatu."
              consequence="Zero halucynacji w danych. LLM może próbować zmyślać — schemat go nie wpuści."
            />
            <PrincipleCard
              num="3"
              title="Wszystko dynamiczne przez bramkę"
              body="Bootstrap z foundera (Phase A) jest konsultancki. Dalsze wpisy z zespołu (Phase A′) idą przez kolejkę review. Manager/dev zatwierdza zanim cokolwiek wpłynie na scoring."
              consequence="Mózg nie deformuje się ani przez plotki, ani przez halucynacje LLM-a. Każda zmiana ma autora i timestamp."
            />
          </div>
        </section>

        {/* STACK TABLE */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Stack docelowy · komponenty
          </h2>
          <div className="mt-3 overflow-hidden rounded-md border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/50">
                <tr className="text-left">
                  <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">Warstwa</th>
                  <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">Technologia</th>
                  <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {STACK.map((row, i) => (
                  <tr
                    key={row.layer}
                    className={cn(
                      'border-t border-zinc-900',
                      i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-950/40',
                    )}
                  >
                    <td className="px-4 py-2.5 font-medium text-zinc-200">{row.layer}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{row.tech}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          'inline-flex rounded px-2 py-0.5 font-mono text-[10px] ring-1',
                          STATUS_COLOR[row.status],
                        )}
                      >
                        {STATUS_LABEL[row.status]}
                      </span>
                      {row.note && (
                        <span className="ml-2 font-mono text-[10px] text-zinc-500">{row.note}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ROADMAP MILESTONES */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Roadmapa · gdzie to idzie
          </h2>
          <div className="mt-3 space-y-3">
            <MilestoneRow
              version="v0.2"
              status="aktualnie"
              title="Pełna pętla operacyjna mózgu"
              items={[
                'Phase A′ daily ingestion (heurystyka + LLM)',
                'Kolejka review z auto-merge → mózg',
                'Czat z inline citations',
                'Telemetria pipeline',
                'Serwer MCP dla agentów',
                'Snapshot history + score deltas',
                'HyperHuman jako case 2 (dogfood)',
              ]}
            />
            <MilestoneRow
              version="v0.3"
              status="następny sprint"
              title="Trwałość + voice in"
              items={[
                'Postgres + Drizzle ORM (typy z tego samego schematu Zod)',
                'Vercel Blob dla raw audio i transkryptów',
                'Whisper API dla notatek głosowych',
                'Cost tracking per case · OpenTelemetry',
                'Tie-breaker dla saturated 100/100 scoring',
              ]}
            />
            <MilestoneRow
              version="v0.4"
              status="po v0.3"
              title="Multi-tenant + ciągłe odświeżanie"
              items={[
                'Clerk auth + per-case permissions',
                'Vercel Cron + Phase A′ batch ingestion',
                'TTS dla briefingu (audio dla foundera w samochodzie)',
                'Pierwsze konektory: Slack + Google Drive',
              ]}
            />
            <MilestoneRow
              version="v0.5"
              status="produkcja v1.0"
              title="Ekosystem"
              items={[
                'MCP po HTTP dla agentów partnerskich',
                'Dwukierunkowy sync z Notion i Linear',
                'Pozostałe konektory: Email · WhatsApp · Allegro · CRM',
                'Marketplace plays library — kontrybucje społeczności',
              ]}
            />
          </div>
        </section>

        {/* WHY */}
        <section className="rounded-md border border-dashed border-zinc-800 bg-zinc-900/30 p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Dlaczego ten widok
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Na rozmowie zawsze przychodzi pytanie &bdquo;ok, fajnie działa, ale gdzie to idzie?".
            Tutaj jest odpowiedź. <span className="text-zinc-200">Dziś</span> — pełna pętla
            operacyjna, telemetria, MCP, ekstrakcja LLM. <span className="text-zinc-200">v1.0</span> —
            trwały Postgres, voice in/out, konektory, multi-tenant.{' '}
            <span className="text-zinc-200">Mapa istnieje</span>, nie improwizuję.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function PrincipleCard({
  num,
  title,
  body,
  consequence,
}: {
  num: string;
  title: string;
  body: string;
  consequence: string;
}) {
  return (
    <article className="rounded-md border border-zinc-800 bg-zinc-950 p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Zasada {num}</p>
      <h3 className="mt-2 text-base font-semibold text-zinc-50">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400">{body}</p>
      <p className="mt-3 border-t border-zinc-800 pt-3 text-xs text-emerald-300/80">
        <span className="font-mono uppercase tracking-widest text-[9px] text-emerald-400">Konsekwencja:</span>{' '}
        {consequence}
      </p>
    </article>
  );
}

function MilestoneRow({
  version,
  status,
  title,
  items,
}: {
  version: string;
  status: string;
  title: string;
  items: string[];
}) {
  const isCurrent = status === 'aktualnie';
  return (
    <article
      className={cn(
        'rounded-md border p-5',
        isCurrent
          ? 'border-emerald-800/60 bg-emerald-950/10'
          : 'border-zinc-800 bg-zinc-950',
      )}
    >
      <div className="flex items-baseline gap-3">
        <span
          className={cn(
            'rounded px-2 py-0.5 font-mono text-xs ring-1',
            isCurrent
              ? 'bg-emerald-900/60 text-emerald-100 ring-emerald-700'
              : 'bg-zinc-900 text-zinc-300 ring-zinc-700',
          )}
        >
          {version}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{status}</span>
        <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      </div>
      <ul className="mt-3 grid gap-1 text-sm text-zinc-400 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
