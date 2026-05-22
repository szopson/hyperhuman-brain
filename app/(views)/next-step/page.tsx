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
        MKT["Rynek — Unfrosen i branża"]
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

interface PlayPrecedent {
  source: string;
  text: string;
}

// Mapping wdrożeń z pakietu + Layer 2 do konkretnych wyników z
// docs/2026-05-21-desk-research-results.md
const PLAY_PRECEDENT: Record<string, PlayPrecedent> = {
  'P-001': {
    source: 'Best Colorful Socks / Belstaff Review',
    text: 'Redukcja kosztów operacyjnych o 80% przy przejściu z Excela na strukturyzowaną bazę wiedzy.',
  },
  'P-020': {
    source: 'World Bank / Bain — Founder\'s Mentality',
    text: '31% utraty innowacyjności gdy founder nie ma cyfrowej konsoli i pozostaje w mikrozarządzaniu.',
  },
  'P-021': {
    source: 'Modanisa / Hello Charles',
    text: '70% zapytań handlowych obsłużonych bez człowieka po systemizacji działań.',
  },
  'P-019': {
    source: 'McKinsey B2B Pulse 2024',
    text: '65% rynku B2B przejmą marketplace\'y do 2025 — wholesalerzy bez monitoringu rynku tracą 5-7% marży EBITDA.',
  },
  'P-002': {
    source: 'NN.07 / Centra Case Study',
    text: '3 lata z rzędu dwucyfrowego wzrostu sprzedaży hurtowej po przejściu z PDF/WhatsApp na strukturyzowaną pamięć klienta.',
  },
  'P-005': {
    source: 'Arc\'teryx / NuORDER',
    text: '+31% wzrost sprzedaży hurtowej, +23% zamówień self-service po wdrożeniu personalizowanej platformy ofertowej.',
  },
  'P-008': {
    source: 'Global Fashion Retail / MapleSage',
    text: '+46% YoY przychodu online, +31% AOV po centralizacji pipeline\'u B2B z ERP/CRM.',
  },
};

interface CaseStudy {
  name: string;
  problem: string;
  action: string;
  result: string;
  source: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    name: 'NN.07',
    problem: 'WhatsApp bottleneck — dane w telefonach handlowców, błędy w stanach',
    action: 'Migracja z PDF/WhatsApp na platformę B2B, WhatsApp API jako most',
    result: '3 lata z rzędu dwucyfrowego wzrostu sprzedaży hurtowej',
    source: 'Hello Charles / Centra Case',
  },
  {
    name: 'Arc\'teryx / Tribal',
    problem: 'Niska efektywność tradycyjnych targów i manualnego zbierania zamówień',
    action: 'Platforma NuORDER dla wszystkich partnerów B2B',
    result: '+31% sprzedaży hurtowej, +23% zamówień self-service',
    source: 'NuORDER Client Data',
  },
  {
    name: 'Global Fashion Retail',
    problem: 'Fragmentacja marek, silosy danych, brak elastyczności cenowej',
    action: 'Centralizacja B2B (Shopify Plus / BigCommerce) z ERP + CRM',
    result: '+46% YoY przychodu online, +31% AOV',
    source: 'MapleSage Analysis',
  },
  {
    name: 'Moda Operandi',
    problem: 'Ryzyko kapitałowe związane z zakupem stocku',
    action: 'Model marketplace / dropship via Mirakl',
    result: '+51% YoY wzrost przychodów z dropshippingu (2025)',
    source: 'Mirakl Case Study',
  },
  {
    name: 'Modanisa',
    problem: 'Przeciążenie działu handlowego powtarzalnymi zapytaniami',
    action: 'AI Chatboty na WhatsApp zintegrowane z platformą',
    result: '70% zapytań rozwiązywanych bez człowieka',
    source: 'WhatsApp Business Case',
  },
];

interface ResearchFinding {
  source: string;
  finding: string;
  implication: string;
}

const RESEARCH_FINDINGS: ResearchFinding[] = [
  {
    source: 'McKinsey B2B Pulse 2024 / Gartner',
    finding: '65% udziału w rynku B2B e-commerce przejmą marketplace\'y do 2025.',
    implication:
      'Model Unfrosen to nie trend, a standard przetrwania. Wholesalerzy bez platformy tracą 5-7% marży EBITDA.',
  },
  {
    source: 'World Bank / Bain — Founder\'s Mentality',
    finding:
      'Firmy tracą 31% innowacyjności i dynamiki, gdy founder nie oddaje kontroli operacyjnej procesom cyfrowym.',
    implication:
      'Mózg firmy jest jedynym sposobem na zachowanie wizji foundera przy jednoczesnym uwolnieniu od mikrozarządzania.',
  },
  {
    source: 'Akerlof (1970) — Market for Lemons',
    finding:
      'Brak transparentności (asymetria informacji) obniża ceny o 20-40% vs realnej wartości stocku.',
    implication:
      'Budowa zaufania cyfrowego (metadane, zdjęcia, tracking) odzyskuje marżę ukrytą przez asymetrię.',
  },
];

const STRATEGIC_PATTERNS = [
  {
    title: 'WhatsApp-First, Platform-Final',
    body: 'Najskuteczniejsze firmy nie porzucają WhatsAppa (98% open rate), ale przesuwają transakcję i prawdę o stanach na platformę. WhatsApp do relacji, platforma do zamknięcia i trackingu.',
  },
  {
    title: 'Ucieczka z pułapki średniego rozwoju',
    body: 'Firmy tracą kontrolę, gdy wiedza o rynku siedzi w głowach handlowców. Mózg firmy musi agregować intencje zakupowe i powody odmów, by founder widział rynek bez filtra handlowca.',
  },
  {
    title: 'Monetyzacja przejrzystości',
    body: 'W branży stockowej największą przewagę daje redukcja asymetrii informacji. Platforma, która pokazuje "co jest w środku palety" lepiej niż konkurencja, może dyktować wyższe ceny — premium for trust.',
  },
];

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

                  {PLAY_PRECEDENT[play.id] && (
                    <div className="mt-3 rounded-md border border-emerald-900/50 bg-emerald-950/20 p-3">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-300/80">
                        Branżowy precedens
                      </p>
                      <p className="mt-1 text-sm text-zinc-200">
                        {PLAY_PRECEDENT[play.id].text}
                      </p>
                      <p className="mt-1 text-[11px] text-emerald-400/60">
                        źródło: {PLAY_PRECEDENT[play.id].source}
                      </p>
                    </div>
                  )}
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

        {/* DESK RESEARCH — DLACZEGO TO ZADZIAŁA */}
        <section className="space-y-6">
          <header>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Dlaczego to zadziała — wzorce z branży
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              To nie jest hipoteza. 7 firm w pokrewnym segmencie zrobiło coś
              podobnego i osiągnęło konkretne wyniki. Poniżej kondensat: 3 wzorce
              strategiczne, 5 najmocniejszych case studies i 3 badania
              makro-rynkowe.
            </p>
          </header>

          {/* 3 STRATEGIC PATTERNS */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              3 wzorce strategiczne
            </h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {STRATEGIC_PATTERNS.map((p) => (
                <article
                  key={p.title}
                  className="rounded-md border border-amber-900/40 bg-amber-950/15 p-4"
                >
                  <h4 className="text-sm font-semibold text-amber-200">
                    {p.title}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                    {p.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {/* CASE STUDIES — 5 CARDS */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Case studies — firmy z podobnym problemem
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CASE_STUDIES.map((c) => (
                <article
                  key={c.name}
                  className="rounded-md border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <p className="font-mono text-[11px] text-zinc-500">
                    {c.source}
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-zinc-50">
                    {c.name}
                  </h4>
                  <p className="mt-2 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-300">Problem:</span>{' '}
                    {c.problem}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-300">Wdrożenie:</span>{' '}
                    {c.action}
                  </p>
                  <p className="mt-2 rounded bg-emerald-950/30 px-2 py-1.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-900/40">
                    Wynik: {c.result}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Pełen raport (7 case studies + 5 badań + metodologia) →{' '}
              <code className="font-mono text-zinc-400">
                docs/2026-05-21-desk-research-results.md
              </code>
            </p>
          </div>

          {/* RESEARCH FINDINGS — 3 CALLOUTS */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Co mówią McKinsey, Gartner, World Bank, Akerlof
            </h3>
            <div className="mt-3 space-y-3">
              {RESEARCH_FINDINGS.map((r) => (
                <article
                  key={r.source}
                  className="rounded-md border border-blue-900/40 bg-blue-950/20 p-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-blue-300/80">
                    {r.source}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-100">
                    {r.finding}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    → {r.implication}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

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
              const prec = PLAY_PRECEDENT[play.id];
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
                  {prec && (
                    <p className="mt-2 text-[11px] text-emerald-300/80">
                      precedens: {prec.text.slice(0, 90)}…
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
