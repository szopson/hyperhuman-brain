# HyperHuman Company Brain — Architecture

## High-level system

```mermaid
flowchart LR
    subgraph Inputs["Inputs (per case)"]
        T[conversation-transcript.txt]
        O[strategic-briefing-overlay.json]
    end

    subgraph PhaseA["Phase A — Extraction"]
        EX[extractFromTranscript<br/>Claude Opus 4.7<br/>tool_use + Zod schema]
    end

    subgraph PhaseB["Phase B — Scoring (deterministic TS)"]
        PS[Problem Score]
        LS[Leakage Score]
        RS[Risk Severity]
        OS[AI Opportunity Score<br/>+ CAVAC readiness]
    end

    subgraph Plays["Plays Library"]
        PL[21 plays · AIPlaySchema]
        MM[Matching engine<br/>pain.category ∩ play.solves_pain_categories]
    end

    subgraph Selection["Next Step Pack"]
        SEL[selectNextStepPlays<br/>iterative greedy<br/>+ MVP effort variant<br/>+ founder-facing boost]
    end

    subgraph Output["Output"]
        AF[analysis-full.json<br/>CompanyAnalysisSchema validated]
    end

    subgraph UI["UI · Next.js 16 App Router"]
        V1[Snapshot]
        V2[Problems]
        V3[Processes]
        V4[Leakage]
        V5[Risks]
        V6[Opportunities]
        V7[Competitive]
        V8[Actions]
        V9[Next Step]
        D[Inspect drawer<br/>scoring math + source quotes]
    end

    T --> EX
    EX --> raw[analysis-raw.json]
    raw --> PhaseB
    O -.merge.-> PhaseB
    PhaseB --> Selection
    PL --> MM
    MM --> OS
    OS --> Selection
    Selection --> AF
    AF --> UI
    V2 -.-> D
    V3 -.-> D
    V6 -.-> D
```

## Data flow per case

```mermaid
sequenceDiagram
    participant U as Konsultant
    participant CLI as npm run extract/pipeline
    participant LLM as Claude Opus 4.7
    participant FS as data/cases/*/outputs/
    participant Web as Next.js dev/Vercel

    U->>CLI: npm run extract
    CLI->>LLM: master prompt + transcript (tool_use)
    LLM-->>CLI: CompanyAnalysis JSON (streamed)
    CLI->>CLI: Zod validate + unwrap company_analysis
    CLI->>FS: analysis-raw.json
    U->>CLI: npm run pipeline
    CLI->>FS: read raw + overlay
    CLI->>CLI: compute scores + match plays + select pack
    CLI->>FS: analysis-full.json
    U->>Web: open localhost:3001
    Web->>FS: loadAnalysis (React cache)
    Web-->>U: 9 widoków z inspect drawer
```

## CAVAC layers in plays library

```mermaid
graph TB
    subgraph CAVAC["CAVAC sequence — Igor Pielas pattern"]
        B[brain<br/>foundation, knowledge bases]
        FF[founder-facing<br/>oczy/uszy/kompas foundera]
        T[tools<br/>vibe-coded backends]
        S[skills<br/>workflow automation]
        W[workflows<br/>multi-step orchestration]
        C[cowork<br/>deployment do zespołu]
    end
    B --> FF
    B --> T
    T --> S
    S --> W
    W --> C
    FF -.+10 boost in.-> MGT[mid_growth_trap phase]
```

## Scoring math at a glance

| Score | Formula | Range |
|---|---|---|
| **Problem** | `freq × sev × strat × emotional × coverage_bonus × 100` | 0–100 (clamped) |
| **Leakage** | `estimated_monthly_leak × recoverability_rate × log10 scaler` | 0–100, cap 500k PLN/mo |
| **Risk severity** | `prob × impact × horizon × mitigation × 100` | 0–100 |
| **AI opportunity** | `0.3·BI + 0.15·AI fit + 0.25·CAVAC + 0.15·Ease + 0.15·Data` | 0–100 (+10 for founder-facing in mid_growth_trap) |

## Anti-hallucination contract

```mermaid
flowchart LR
    Q[Every entity in CompanyAnalysis]
    Q --> SQ[has ≥1 SourceQuote]
    SQ --> H[high/medium/low confidence]
    SQ --> S[source: transcript / document / inferred]
    UI[UI inspect-drawer] --> SQ
    UI --> SM[Scoring math]
    SM --> F[formula string]
    SM --> CO[components object]
```

Każda liczba w UI jest **klikalna** — pokazuje formula + raw components + raw quotes z confidence. Konsultant w demo może rozwinąć dowolną decyzję do source-of-truth w transkrypcie.

## Repo layout

```
lib/
  schemas/         — Zod (CompanyAnalysisSchema, AIPlaySchema, ...) · single source of truth
  extraction/      — Phase A (LLM tool_use + Zod validate)
  scoring/         — deterministic TS · problem/leakage/risk/opportunity
  plays/           — 21 plays library + matching + selection
  storage/         — server-side analysis loader (React cache)
app/
  page.tsx         — redirect → /snapshot
  layout.tsx       — root (dark mode)
  (views)/
    snapshot/      — hero diagnoza + metrics
    problems/      — sortowana tabela z inspect math
    processes/     — CAVAC bars per proces
    leakage/       — recoverable PLN/mo z assumptions
    risks/         — 2×2 quadrant + listing
    opportunities/ — top 15 plays z CAVAC sub-scores
    competitive/   — 5-dim positioning
    actions/       — Kanban preview (P-021 placeholder)
    next-step/     — Pack hero + Layer 2 sneak peek
components/
  layout/AppShell.tsx
  shared/InspectDrawer.tsx · ScoreBar.tsx · ComingSoonStub.tsx
  ui/              — shadcn (button/card/badge/tabs/table/sheet/dialog)
scripts/
  test-extract.ts        — npm run extract
  test-full-pipeline.ts  — npm run pipeline
  screenshot-views.ts    — npm run screenshots
data/cases/stock-hurt/
  inputs/conversation-transcript.txt
  inputs/strategic-briefing-overlay.json
  outputs/analysis-raw.json
  outputs/analysis-full.json
  debug/screenshots/*.png
  debug/founder-identification.md
```
