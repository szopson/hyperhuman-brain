import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { getPlayById } from '@/lib/plays/library';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MermaidDiagram } from '@/components/shared/MermaidDiagram';

const ARCHITECTURE_DIAGRAM = `flowchart LR
    subgraph SYS["Wasze systemy"]
        ERP["ERP"]
        WMS["WMS — magazyn"]
        CRM["CRM — 1000+ klientów"]
        WA["WhatsApp — 97% komunikacji"]
        AL["Allegro — 200k SKU"]
        MKT["Rynek — Unfrozen i branża"]
    end

    INTG["Automatyczne integracje"]

    KB["Spójna baza wiedzy firmy (P-001)"]

    MKI["Monitoring rynku (P-019)"]

    subgraph OUT["Codzienny output dla Pawła i Kuby"]
        BRF["Briefing dzienny (P-020)"]
        ACT["Plan działań (P-021)"]
    end

    subgraph SAL["Layer 2 — narzędzia dla działu sprzedaży"]
        CM["Pamięć klienta (P-002)"]
        OFF["Spersonalizowane oferty (P-005)"]
        LEA["Pipeline leadów B2B (P-008)"]
    end

    ERP --> INTG
    WMS --> INTG
    CRM --> INTG
    WA --> INTG
    AL --> INTG
    INTG --> KB

    MKT --> MKI

    KB --> BRF
    MKI --> BRF
    KB --> ACT

    BRF -. "cykl dzienny" .-> KB

    KB -. "po Layer 1" .-> CM
    KB -. "po Layer 1" .-> OFF
    KB -. "po Layer 1" .-> LEA

    classDef existing fill:#1c1917,stroke:#52525b,color:#a1a1aa
    classDef phase1 fill:#451a03,stroke:#b45309,color:#fde68a
    classDef phase2 fill:#0c1929,stroke:#1e3a8a,color:#93c5fd
    class ERP,WMS,CRM,WA,AL,MKT,INTG existing
    class KB,MKI,BRF,ACT phase1
    class CM,OFF,LEA phase2`;

const LAYER_COLOR: Record<string, string> = {
  brain: 'bg-violet-950 text-violet-200 ring-violet-800',
  'founder-facing': 'bg-amber-950 text-amber-200 ring-amber-800',
  tools: 'bg-cyan-950 text-cyan-200 ring-cyan-800',
  skills: 'bg-emerald-950 text-emerald-200 ring-emerald-800',
  workflows: 'bg-blue-950 text-blue-200 ring-blue-800',
  cowork: 'bg-zinc-900 text-zinc-300 ring-zinc-800',
};

const LAYER_LABEL: Record<string, string> = {
  brain: 'Fundament',
  'founder-facing': 'Dla zarządu',
  tools: 'Narzędzie',
  skills: 'Automatyzacja',
  workflows: 'Workflow',
  cowork: 'Wdrożenie zespołu',
};

export default async function Page() {
  const a = await loadAnalysis();
  const pack = a.next_step_pack;
  const selectedPlays = pack.selected_plays
    .map((id) => ({ id, play: getPlayById(id), match: a.play_matches.find((m) => m.play_id === id) }))
    .filter((x) => x.play);

  // Layer 2 sneak peek: top 3 plays NOT in pack, sorted by composite.
  const layer2 = a.play_matches
    .filter((m) => !pack.selected_plays.includes(m.play_id))
    .slice(0, 3)
    .map((m) => ({ match: m, play: getPlayById(m.play_id) }))
    .filter((x) => x.play);

  return (
    <AppShell active="next-step">
      <div className="mx-auto max-w-5xl space-y-10">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            09 · Nasza propozycja
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            Co proponujemy jako pierwszy krok
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Fundament mózgu firmy + warstwa wsparcia zarządu. Pakiet
            {' ' + pack.selected_plays.length} wdrożeń w {pack.timeline_weeks}{' '}
            tygodni, każde wybrane tak, żeby adresować realne problemy z
            transkryptu i zostawiać przestrzeń na kolejne kroki.
          </p>
        </header>

        {/* TIMELINE + COMPOSITION HERO */}
        <section className="rounded-xl border border-amber-900/50 bg-gradient-to-br from-amber-950/30 to-zinc-950 p-6">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300/80">
                Czas wdrożenia
              </p>
              <p className="mt-1 text-4xl font-semibold text-zinc-50">
                {pack.timeline_weeks}{' '}
                <span className="text-xl text-zinc-500">tygodni</span>
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300/80">
                Wdrożenia
              </p>
              <p className="mt-1 text-4xl font-semibold text-zinc-50">
                {pack.selected_plays.length}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300/80">
                Charakter
              </p>
              <p className="mt-1 text-xl font-semibold text-zinc-50">
                Pierwszy krok
              </p>
            </div>
          </div>
        </section>

        {/* SELECTED PLAYS */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Wybrane wdrożenia w pakiecie
          </h2>
          <ol className="mt-3 space-y-3">
            {selectedPlays.map(({ play, match }, i) => {
              if (!play) return null;
              const mvp = play.effort_weeks_mvp?.typical;
              const eff = mvp ?? play.effort_weeks.typical;
              return (
                <li
                  key={play.id}
                  className="rounded-md border border-zinc-800 bg-zinc-900/50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-zinc-500">
                          0{i + 1}
                        </span>
                        <Badge
                          className={cn(
                            'ring-1 text-[10px]',
                            LAYER_COLOR[play.cavac_layer],
                          )}
                        >
                          {LAYER_LABEL[play.cavac_layer] ?? play.cavac_layer}
                        </Badge>
                        {mvp && (
                          <Badge className="bg-emerald-950 text-emerald-300 ring-1 ring-emerald-800 text-[10px]">
                            Faza 1: {mvp} tyg. (pełna: {play.effort_weeks.typical} tyg.)
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-zinc-50">
                        {play.name_pl ?? play.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        {play.one_liner}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-2xl font-semibold text-zinc-50">
                        {match?.composite_score ?? '—'}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                        ocena końcowa
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                    <div>
                      <p className="text-zinc-500">Czas</p>
                      <p className="mt-0.5 font-mono text-zinc-200">{eff} tyg.</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Problemy adresowane</p>
                      <p className="mt-0.5 font-mono text-zinc-200">
                        {match?.matched_pains.length ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Pewność</p>
                      <p className="mt-0.5 font-mono uppercase text-zinc-200">
                        {match?.confidence === 'high' ? 'wysoka' : match?.confidence === 'medium' ? 'średnia' : 'niska'}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">PLN/m-c odzysk</p>
                      <p className="mt-0.5 font-mono text-zinc-200">
                        {match?.estimated_impact_pln_monthly
                          ? `${(match.estimated_impact_pln_monthly / 1000).toFixed(0)}k PLN`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-zinc-400">
                    <span className="font-medium text-zinc-300">
                      Oczekiwany efekt:
                    </span>{' '}
                    {play.expected_impact_qualitative}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ARCHITECTURE DIAGRAM */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Jak to będzie zbudowane
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Wasze istniejące systemy podłączamy do warstwy mózgu firmy przez
            automatyczne integracje. Mózg karmi codzienny output dla zarządu i
            jest fundamentem pod kolejną warstwę — narzędzia dla działu sprzedaży.
          </p>
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 lg:p-6">
            <MermaidDiagram id="architecture-next-step" chart={ARCHITECTURE_DIAGRAM} />
          </div>
        </section>

        {/* DELIVERABLES */}
        {pack.deliverables.length > 0 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Co dostarczamy
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
              {pack.deliverables.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-zinc-600">▸</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* TEAM + COMMITMENT */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Nasz zespół
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
              {pack.team_required.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Czego potrzebujemy od was
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
              {pack.client_commitment.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* RISKS + ASSUMPTIONS */}
        {pack.risks_and_assumptions.length > 0 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Ryzyka i założenia
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
              {pack.risks_and_assumptions.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-500">▲</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* LAYER 2 SNEAK PEEK */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Co dalej po pierwszym kroku
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Po sukcesie pakietu pierwszego naturalnie wchodzi drugi etap — trzy
            wdrożenia o najwyższej ocenie spoza obecnego pakietu, gotowe do
            uruchomienia gdy fundament działa.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {layer2.map(({ play, match }) => {
              if (!play) return null;
              return (
                <div
                  key={play.id}
                  className="rounded-md border border-zinc-800 bg-zinc-950 p-3"
                >
                  <p className="text-sm font-medium text-zinc-100">
                    {play.name_pl ?? play.name}
                  </p>
                  <p className="mt-2 font-mono text-xs text-zinc-400">
                    ocena {match.composite_score} · {play.effort_weeks.typical} tyg.
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
