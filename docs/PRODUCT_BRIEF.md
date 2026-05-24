# HyperHuman Company Brain — Product Brief

**Diagnostic console dla founderów w pułapce średniego rozwoju.** Z 3-godzinnej rozmowy konsultanta z founderem produkuje strukturyzowaną analizę firmy + rekomendowany pierwszy projekt AI z uzasadnieniem każdej decyzji.

---

## Co to robi

Konsultant HyperHuman ma rozmowę 2–3h z founderami klienta. Wcześniej narzędzie to było notatkami + Slack-em + intuicją. Teraz:

1. **Wrzuca transkrypt** (Whisper przepisany, polski, surowy)
2. **`npm run extract`** → Claude Opus 4.7 z tool-use ekstraktuje 8 typów encji (firma, procesy, painy, ryzyka, metryki, narzędzia, stakeholderzy, konkurencja) zgodnie z Zod schema · **każda encja ma source_quotes z transkryptu**
3. **`npm run pipeline`** → deterministyczny TypeScript scoring + matching:
   - Problem Score per pain (freq × sev × strat × emo × coverage)
   - Revenue Leakage per pain z assumptions + sensitivity range
   - Risk Severity z time horizon + mitigation
   - 21 plays z curated library matchuje się do painów po kategorii
   - AI Opportunity Score z CAVAC readiness (4 sub-scores: knowledge/tools/integrations/skills)
   - Constraint-satisfaction selektor składa **pakiet 4-6 plays w 8-12 tygodni** który adresuje burning painy + imminent risks + ma sensowną sekwencję wdrożeniową
4. **UI Next.js 16** z 9 widokami: każda liczba klikalna → drawer z scoring math + source quotes + confidence

## Co odróżnia od „LLM-generated PowerPoint"

| Cecha | Tu | Generyczny AI consultant |
|---|---|---|
| **Anti-halucynacyjna dyscyplina** | każda liczba musi mieć source_quote z confidence rating | LLM wymyśla numery, brzmią wiarygodnie |
| **Scoring deterministyczny** | TypeScript, inspectable formula per liczba | LLM wraca z opinią ranking |
| **Plays library kurowana** | 21 plays z effort estimate, prerequisites, CAVAC readiness | "AI może pomóc w sprzedaży, marketingu i operacjach" |
| **Constraint satisfaction selektor** | iterative greedy z prereq chain + budżet + founder-facing boost | "Top 3 things to do" |
| **Continuous refresh ready** | data model rozdziela Phase A (ekstrakcja) od scoring (deterministic), więc continuous ingestion wpada w Phase A automatycznie | one-shot raport, ekspiruje za miesiąc |

## Konkretny case: Stock-Hurt

Klient: B2B off-price fashion stock dealing, 7M EUR hurt + 5M EUR detal Allegro, 12 lat, 2 founderów (Paweł + Maciej). Założycielska intuicja zaprowadziła firmę do "operacyjnej dojrzałości" — 5% YoY decline nie z rynku, ale z **utraty pełnego obrazu firmy przez founderów**.

Z transkryptu 111k znaków pipeline wyciąga:
- 9 painów (z czego top 2 score 100/100 po clamp: fragmentacja narzędzi + utrata obrazu)
- 4 risks (Allegro koncentracja, supply mismatch, Unfrosen, data leak)
- 9 metryk, 7 procesów, 13 tooli, 6 stakeholderów, 3 konkurentów
- 20 z 21 plays matchuje przynajmniej jeden pain
- Selektor proponuje pakiet **P-001 + P-020 + P-021 + P-019** (Brain + Founder Briefing + Action Points + Market Intelligence) w **12 tygodni** używając MVP-variant timeline. Adresuje 2 burning painy i 3 imminent risks.

**To jest reproducible.** Drugi klient w tej samej branży dostanie inny pakiet z tym samym algorytmem — bo jego transkrypt da inne score distribution, ale ta sama plays library i te same constraints zadziałają.

## Defensible w demo

W każdym widoku liczby są **klikalne**. Klik na Problem Score 100 dla pain-founder-detachment otwiera drawer:
- Formula: `freq × sev × strat × emotional × coverage_bonus`
- Components JSON: `{frequency:{value:"constant",weight:1}, severity:{value:"critical",weight:1}, strategic:{value:"blocks_endgame",weight:1}, emotional:{value:"burning",multiplier:1.6}, coverage:{value:7,multiplier:1.3}}`
- Source quotes z transkryptu i overlay z confidence high/medium/low
- Extra properties: estimated monthly leak, recoverable PLN, recoverability rate, leakage confidence

**„Ta liczba pochodzi STĄD"** zamiast „LLM powiedział".

## Stan v0.1 (Day 1-4)

- ✅ Phase A ekstrakcja działa end-to-end na transkrypcie Stock-Hurt (Claude Opus 4.7, streaming, draft 2020-12 JSON Schema)
- ✅ Strategic briefing overlay merge (founder pain wstrzykiwany spoza transkryptu)
- ✅ Scoring engine 4 algorytmy + orchestrator z sanity report (top 5 pains/risks/plays, red flag scan)
- ✅ 21 plays z library zwalidowane przez AIPlaySchema, MVP-variant effort per kluczowych
- ✅ Constraint selector z iterative greedy + budget enforcement + prereq satisfaction + founder-facing +10 boost
- ✅ 9 widoków UI z realnymi danymi + inspect-math drawer
- ✅ Anti-hallucination jako kod (Zod validate, source_quotes required, deterministic scoring)

## Co weszło w v0.2 (branch `feature/stock-hurt-v0.2`) — odpowiedź na feedback HyperHuman + przewaga konkurencyjna

**Trzeci sprint v0.2** dorzucił domknięcie pętli operacyjnej:
- **Auto-merge approve → brain** — approve w `/review` przekształca PendingEntity w pełnoprawny Pain/Risk, robi snapshot poprzedniej wersji do `outputs/history/` i wpycha do `analysis-full.json`. Pętla zamknięta: ingest → review → approve → mózg się zmienia.
- **`/eval` view** — telemetria pipeline: schema validation, source quote coverage, scoring distribution z ostrzeżeniem clamp ceiling, pending velocity, Phase A′ extraction fidelity (czy LLM nie halucynuje cytatów). Odpowiedź na „jak mierzysz że to działa".
- **Snapshot history + score deltas** — briefing pokazuje `pain-X: 95 → 100 (+5)` vs poprzedni snapshot, ticker pokazuje top-pain delta. Mózg ma historię.

**Drugi sprint v0.2** dorzucił 4 rzeczy które celują w "AI System Lead" mindset:
- **MCP server** — mózg jako tool surface dla innych agentów, nie tylko dashboard. `npm run mcp` startuje stdio server z 5 toolami (list_pains, list_risks, get_play, get_source_quote, get_next_step_pack).
- **LLM-driven Phase A′** — `npm run ingest -- --llm` używa Claude Opus 4.7 + tool_use + Zod schema do strukturyzowanej ekstrakcji daily notes. Każda obserwacja dostaje verbatim source_quote i auto-match do istniejących encji.
- **HyperHuman jako case 2** — pełny dogfood case w `data/cases/hyperhuman/`. Cookie-based case switcher w AppShell. Pokazuje że produkt jest reproducible i że HyperHuman siedzi w tej samej pułapce.
- **Live Brain Ticker** — snapshot pokazuje ostatni ingest, pending count, approved/7d — wizualnie destrukcja narracji "one-shot raport".



Rozmowa z HyperHuman pokazała, że ich wizja to **„centralny mózg firmy" zasilany
codziennie przez zespół**, nie jednorazowy raport diagnostyczny. v0.2 dokłada
architekturę tej warstwy:

- **Phase A′ — daily ingestion**: `data/cases/{slug}/inputs/daily/{date}/{author}.md`
  z frontmatter (author_id, role, source_type, related_entities). `npm run ingest`
  parsuje, klasyfikuje entity_type i zapisuje do `pending-queue.json` z
  `review.status='pending'`.
- **Review queue (`/review`)**: human-in-the-loop bramka. Manager / dev klika
  approve → encja wchodzi do mózgu; reject → archiwum. Pending entities NIE są
  liczone w scoring i nie pojawiają się w dashboardach.
- **Chat over brain (`/chat`)**: drugi tryb obok dashboardów, dla mniej
  technicznych pracowników klienta. Server-side składa compact RAG context z
  approved entities i forsuje 3 zasady: inline citations [chunk-id], dosłowne
  cytaty, „nie mam tej informacji" gdy kontekst nie pokrywa pytania. Ten sam
  anty-halucynacyjny kontrakt co inspect drawer, w formacie czatu.
- **Weekly Founder Briefing (`npm run briefing`)**: dogfood play P-020 z naszej
  własnej library — markdown digest z nowymi sygnałami, top painami, imminent
  risks, statusem next-step pack i 3 decyzjami na tydzień.
- **Schemas**: `SourceQuote` dostała `source_role`, `source_type`, `author_id`,
  `ingested_at` (defaultowane, więc istniejące `analysis-full.json` dalej
  waliduje). `Pain`/`Risk`/`Process` mają `review: ReviewMetadata`. Nowy
  `PendingEntitySchema` + `PendingQueueSchema`.

## Co dalej (v0.3+)

- **`PainSchema.category` enum bump** — dodać `competitive_risk`, regenerować Phase A
- **Bi=10.0 saturation** — top plays mają identyczny business_impact bo composite painów /10 saturuje przy burning+critical paina. Znormalizować przez log scale lub percentile ranking
- **Tied 100/100 top pains** — clamp ceiling. Tie-breaker przez source-quote count lub depth-of-evidence
- **Phase B Enrichment Pass** — wzbogacenie encji o szczegółowe pola post-ekstrakcji, zamiast inline w Phase A (master prompt verbatim)
- **LLM-driven Phase A′ ekstrakcja** — obecnie ingestion klasyfikuje entity_type heurystyką po keywords. Następny krok: prompt Phase A na pojedynczym daily input + merge z istniejącym schematem
- **Source role weighting w scoring** — `source_role: 'employee'` powinno mieć inną wagę niż `'founder'` w problem-score (np. employee-reported pain = walidacja, founder-reported = burning emocja)
- **Auth + multi-tenant** — UI hardcoduje `stock-hurt`. Dodać case switcher + per-case dostęp
- **Real-time connectors** — WhatsApp/Email/Allegro feeds → daily ingestion automatic (zamiast manualnego dropowania plików .md)
- **Audio in/out** — Whisper dla voice notes na wejściu, TTS dla briefingu na wyjściu (HH explicite preferowało voice format)
- **5 pozostałych widoków polish** — pełna Kanban dla actions z drag-and-drop, dependency graph dla processes, P&I matrix interactive dla risks
