# Demo script — Loom 3 min

> Skrypt do nagrania własnej kamery + ekranu. Daje 3-minutową narrację z konkretnymi screen-momentami.

## Setup

- Otwórz `http://localhost:3001/snapshot` (lub Vercel URL)
- Mieć drugą zakładkę z `data/cases/stock-hurt/outputs/analysis-full.json` żeby pokazać że to realny output, nie hardcoded fixture
- Loom 1440×900, screen + face

## Beat sheet (3 min)

### 0:00–0:20 · Setup problemu (face)

> „Founderzy w średnim rozwoju mają tę samą chorobę: zbudowali firmę intuicją, ale stracili pełny obraz. Mózg im się rozproszył. Konsultant ma 3 godziny rozmowy żeby to zrekonstruować, a potem leci PowerPoint który expiruje za miesiąc. Ja zbudowałem coś innego."

### 0:20–0:50 · Snapshot view (screen)

- Otwórz `/snapshot`
- Pokaż lewy sidebar: "Stockhurt, Paweł, Maciej, refreshed 2 min ago"
- Hero: „Founderzy stracili pełny obraz firmy"
  - „To pain top-1. Algorytm sam to wyciągnął — z transkryptu + briefingu konsultanta"
- Klik metryki `7.0M EUR` → drawer pokazuje source quotes z transkryptu
  - „Każda liczba w tej apce jest klikalna. Pokazuje skąd pochodzi"

### 0:50–1:30 · Problems view (screen)

- Otwórz `/problems`
- „9 painów posortowanych przez Problem Score: freq × sev × strat × emotional × coverage"
- Klik score `100` przy `pain-founder-detachment`
  - drawer: scoring math JSON, components: `frequency=constant, severity=critical, emotional=burning multiplier 1.6, coverage 7 procesów`
  - "To deterministyczne. Nie LLM. TypeScript. Inspectable."
  - „I leakage estimate: 500k PLN/mo recoverable, z 55% rate, medium confidence, range 250–750k"
- Pokaż source quotes z transkryptu w drawerze
  - „Konsultant w call-u może rozwinąć każdą decyzję do source-of-truth"

### 1:30–2:10 · Opportunities view (screen)

- Otwórz `/opportunities`
- „21 plays z curated library — kurowana, nie auto-generowana. CAVAC pattern Igora Pielasa"
- Top 3 podświetlone amber: `founder-facing` z `+10 boost`
  - „Algorytm wie że klient jest w mid-growth-trap → bumpuje plays które adresują founder pain"
- Pokaż kolumnę CAVAC sub-scores K/T/I/S
  - „4 wymiary readiness: knowledge, tools, integrations, skills. Bez tego play nie zadziała"
- Klik composite `89` przy P-020
  - drawer: matched pains, solution pattern, prerequisites, caveats

### 2:10–2:45 · Next Step view (screen)

- Otwórz `/next-step`
- „Tu nie jest 'top 4 plays po score'. To **constraint-satisfaction**: pakiet musi się zmieścić w 12 tygodniach, prerekwizyty muszą być spełnione w pakiecie, layer order Brain→Tools→Skills→Workflows→Cowork"
- Pokaż 4 selected: P-001 + P-020 + P-021 + P-019 z MVP-variant badge
  - „Każdy MVP variant trimuje effort 60-80% value. Pakiet 12 tygodni razem"
- Pokaż Layer 2 sneak peek na dole
  - „Po sukcesie Layer 1 → P-008 Lead Pipeline + P-002 Client Memory + P-007 Onboarding"

### 2:45–3:00 · Close (face)

> „To nie jest deck. To jest **continuous diagnostic tool**. Same dane wpadają codziennie z WhatsApp/Allegro/ERP, scoring odpala się ponownie, action points pojawiają się w widoku Actions. Konsultant nie pisze raportu — operuje konsolą. Founder dostaje weekly briefing automatycznie."

## Co warto powiedzieć ale można pominąć w 3 min

- Master prompt verbatim z `EXTRACTION_AND_SCORING.md §4.2`
- Strategic briefing overlay jako mechanizm dodawania painów spoza transkryptu
- Anti-hallucination contract: każda encja w schemacie wymaga source_quotes
- Phase A (LLM) vs Phase B (deterministic TS) — czyste odseparowanie
- Dark mode default (data dashboards)
