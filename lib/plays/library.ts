import { AIPlaySchema, type AIPlay } from '@/lib/schemas';

const PLAYS_RAW: AIPlay[] = [
  {
    id: 'P-001',
    name: 'Sales Operations Knowledge Base',
    name_pl: 'Baza wiedzy operacji sprzedaży',
    one_liner:
      'Strukturyzowana baza wiedzy sprzedażowej (procesy, klasyfikacje klientów, polityka rabatowa, scope of service) zorganizowana w stylu Activy Brain Igora Pielasa.',
    industry_tags: ['off_price_fashion', 'b2b_wholesale', 'universal_pattern'],
    cavac_layer: 'brain',
    solves_pain_categories: ['knowledge_silos', 'lost_context', 'compliance_risk'],
    solution_pattern:
      'GitHub repo z hierarchią internal/ vs client-facing/. 4 meta-pliki (README, CLAUDE.md, taxonomy.md, CONTRIBUTING.md). Dystrybuowane przez rclone → Google Drive → Cowork u nietechnicznego zespołu. Foldery clients/tiers/, suppliers/zalando_about_you_otrium/, pricing/wholesale_margins/, processes/offering_negotiation_followup/, brands/premium_vs_basic/.',
    solution_pattern_pl: 'Centralna baza wiedzy o sprzedaży na GitHub — procesy, klasyfikacje klientów, polityka rabatowa. Podzielona na sekcję wewnętrzną (notatki handlowców, marże) i klient-facing (oferty, polityki publiczne). Dystrybuowana do zespołu przez Google Drive. Struktura wzorowana na sprawdzonym pattern Igora Pielasa.',
    effort_weeks: { min: 3, typical: 4, max: 6 },
    effort_weeks_mvp: { typical: 3 },
    expected_impact_qualitative:
      'Fundament dla wszystkich pozostałych plays. Onboarding nowego handlowca z 4 miesięcy do 2-3 tygodni. Likwidacja "pytaj Emila".',
    expected_impact_quantitative:
      'Nieliczalny bezpośrednio, ale enabler dla 12+ innych plays.',
    requires: {
      data: [
        'dostęp do istniejących SOPs (Notion, Sheets, agendy spotkań)',
        'wywiady ~1h z 4-5 osobami',
      ],
      integrations_mcp: ['GDrive MCP (read)', 'Notion MCP (read)'],
      skills_to_write: ['/kb-feedback'],
      custom_tools: [],
    },
    prerequisites: [],
    example_skill_file_path: null,
  },
  {
    id: 'P-002',
    name: 'Client Memory Layer (WhatsApp Ingestion)',
    name_pl: 'Pamięć klienta (WhatsApp)',
    one_liner:
      'Strukturyzowana baza per-klient łącząca dane transakcyjne z AppSheet/WMS z kontekstem rozmów z WhatsApp (preferences, planowane zakupy, no-go brands, osobiste detale).',
    industry_tags: ['b2b_whatsapp_heavy', 'off_price_fashion', 'universal_pattern'],
    cavac_layer: 'brain',
    solves_pain_categories: ['lost_context', 'customer_experience', 'lost_revenue'],
    solution_pattern:
      'WhatsApp Business API integration (lub WA-Web-scraper jako fallback). Daily batch: każdy wątek → LLM extract → structured update per client w pliku clients/{client_slug}/context.md. Schema: last_contact, last_transaction, expressed_preferences, no_go_brands, personal_notes, planned_purchases, followup_due_dates. Bot daily generuje briefing dla handlowca.',
    solution_pattern_pl: 'Codzienna integracja z WhatsApp Business: każdy wątek z klientem analizowany przez AI, zapisywany jako profil klienta z preferencjami, no-go markami, planowanymi zakupami i osobistymi detalami. Rano handlowiec dostaje briefing: do kogo dzwonić, o czym pamiętać, co obiecywał.',
    effort_weeks: { min: 4, typical: 6, max: 10 },
    effort_weeks_mvp: { typical: 4 },
    expected_impact_qualitative:
      'Eliminuje "kurczę, zapomniałem o tym kliencie" — top emotional pain z transkryptu.',
    expected_impact_quantitative:
      'Recovery 20-30% niewykorzystanego potencjału z istniejących ~1000 klientów = potencjalnie 100-200k PLN/miesiąc dodatkowego revenue.',
    requires: {
      data: ['dostęp do WhatsApp Business / WA-Web sesji 1-2 handlowców'],
      integrations_mcp: ['WhatsApp custom MCP', 'AppSheet MCP'],
      skills_to_write: [
        '/client-context [name]',
        '/daily-briefing',
        '/whatsapp-summarize-thread',
      ],
      custom_tools: ['WhatsApp ingestion service', 'client context schema'],
    },
    prerequisites: ['P-001'],
    example_skill_file_path: null,
  },
  {
    id: 'P-003',
    name: 'Strategy & Decision Log',
    name_pl: 'Dziennik decyzji strategicznych',
    one_liner:
      'Osobna warstwa Brain trzymająca strategiczne decyzje firmy (kierunek marketplace, decyzje produktowe, plany migracji), żeby agenci i zespół byli aligned.',
    industry_tags: ['universal_pattern'],
    cavac_layer: 'brain',
    solves_pain_categories: ['knowledge_silos', 'scaling_blocker'],
    solution_pattern:
      'Append-only log decyzji strategicznych z metadanymi (data, decydent, kontekst, alternatywy rozważane, zobowiązanie). Konsumowany przez agentów dla strategic alignment.',
    solution_pattern_pl: 'Append-only dziennik decyzji strategicznych firmy z metadanymi: data, kto decydował, jaki kontekst, jakie alternatywy rozważano. Konsumowany przez agentów AI dla strategicznego alignment — żeby zespół i automatyzacje wiedziały dokąd zmierzamy.',
    effort_weeks: { min: 1, typical: 2, max: 3 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Alignment zespołu, agenty dostają strategiczny kontekst do dawania lepszych odpowiedzi.',
    expected_impact_quantitative:
      'Pośrednio przez decyzje (nie podejmujesz krótkoterminowych projektów blokujących endgame).',
    requires: {
      data: ['2-godzinny wywiad strategiczny z founderami'],
      integrations_mcp: [],
      skills_to_write: [],
      custom_tools: [],
    },
    prerequisites: ['P-001'],
    example_skill_file_path: null,
  },
  {
    id: 'P-004',
    name: 'Excel-to-Product-Card Generator',
    name_pl: 'Generator kart produktowych',
    one_liner:
      'Bot, który z Excela listy pakunkowej dostawcy (Zalando, About You, Otrium) + zdjęć katalogowych generuje pełne karty produktowe gotowe do publikacji.',
    industry_tags: ['off_price_fashion', 'allegro', 'marketplace_listing'],
    cavac_layer: 'tools',
    solves_pain_categories: [
      'manual_repetitive_work',
      'data_quality',
      'customer_experience',
    ],
    solution_pattern:
      'Excel upload → schema detection per supplier → LLM extraction do unified schema → image processing (Nano Banana model photos) → render karty → eksport do bazy produktowej + Allegro API.',
    solution_pattern_pl: 'Excel od dostawcy + zdjęcia katalogowe → automatyczne karty produktowe gotowe do publikacji. AI rozpoznaje strukturę każdego dostawcy (Zalando, About You, Otrium różne), tłumaczy do jednolitego schematu, generuje karty wizualnie spójne. Eksport bezpośrednio do Allegro i bazy produktowej.',
    effort_weeks: { min: 3, typical: 5, max: 8 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Sesje nie zapominają o 2 z 8 produktów. Karty wyglądają jak Unfrosen, nie jak Excel. Czas listingu z godzin do minut.',
    expected_impact_quantitative:
      '~90% redukcja kosztów per listing. 1000 listings/miesiąc × 30 min handlowca → 500h/miesiąc oszczędności = ~40k PLN/miesiąc + ~50-100k miesięcznie revenue z lepszej konwersji.',
    requires: {
      data: ['próbki Excelów od 3-4 dostawców', 'próbki zdjęć katalogowych'],
      integrations_mcp: ['WMS MCP', 'Allegro API'],
      skills_to_write: ['/generate-product-card', '/bulk-process-shipment'],
      custom_tools: ['PCG service', 'Nano Banana wrapper'],
    },
    prerequisites: ['P-001'],
    example_skill_file_path: null,
  },
  {
    id: 'P-005',
    name: 'Personalized Offer Generator',
    name_pl: 'Generator spersonalizowanych ofert',
    one_liner:
      'Bot generujący spersonalizowane oferty B2B per klient — łączy preference klienta (z P-002) z dostępnym stockiem i sugeruje top-N matching products.',
    industry_tags: ['off_price_fashion', 'b2b_wholesale'],
    cavac_layer: 'skills',
    solves_pain_categories: [
      'manual_repetitive_work',
      'lost_revenue',
      'customer_experience',
    ],
    solution_pattern:
      'Handlowiec w Cowork: /oferta dla {klient}. Skill ładuje client_context.md, aktualny stock z WMS, historię transakcji. LLM generuje: top-N matching products + draft wiadomości WhatsApp + link do interaktywnej prezentacji (P-006).',
    solution_pattern_pl: 'Handlowiec wpisuje „/oferta dla {klient}" — system ładuje profil klienta z pamięci, sprawdza aktualny stock, historię transakcji. AI proponuje top-N produktów, drafts wiadomość WhatsApp i link do interaktywnej prezentacji. Z chaotycznego pisania od zera do precyzyjnej oferty w 30 sekund.',
    effort_weeks: { min: 2, typical: 3, max: 5 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Eliminuje top burning pain z rozmowy: "handlowcy tracą czas na ręczne wysyłanie ogólnych ofert".',
    expected_impact_quantitative:
      'Przy 6 handlowcach × 3h/dzień = 360h/miesiąc → cel 50% reduction = 180h × 80 PLN = 14.4k PLN/miesiąc + lift konwersji z 4% na 8-10%.',
    requires: {
      data: ['historia transakcji per klient', 'kategoryzacja Tier 1/2/3', 'aktualny stock'],
      integrations_mcp: ['AppSheet MCP', 'WMS MCP', 'WhatsApp send-MCP'],
      skills_to_write: ['/oferta', '/draft-whatsapp', '/match-products-to-client'],
      custom_tools: ['client matching engine'],
    },
    prerequisites: ['P-001', 'P-002', 'P-004'],
    example_skill_file_path: null,
  },
  {
    id: 'P-006',
    name: 'Interactive Offer Presentation Generator',
    name_pl: 'Interaktywne prezentacje ofert',
    one_liner:
      'Lekkie interactive web prezentacje per oferta zamiast Excela/PDF, z zdjęciami produktów, cenami, CTA. Link wysyłany na WhatsApp.',
    industry_tags: ['off_price_fashion', 'b2b_wholesale'],
    cavac_layer: 'tools',
    solves_pain_categories: ['customer_experience', 'lost_revenue'],
    solution_pattern:
      'Static site generator (Astro/Next SSG). Wejście: JSON z listą produktów. Wyjście: short-link stockhurt.eu/o/{client}-{period} z embeddable preview kartami z P-004. Tracking otwarć, kliknięć per produkt.',
    solution_pattern_pl: 'Zamiast Excela/PDF — krótka strona internetowa per oferta. Zdjęcia produktów, ceny, CTA „buy now", link wysyłany na WhatsApp. Tracking otwarć i kliknięć per produkt. „Wow factor" dla klientów typu Atelier, którzy widzą że jesteście lepiej zorganizowani niż konkurencja.',
    effort_weeks: { min: 2, typical: 3, max: 4 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Wow factor dla klientów — pierwszy impression "ci są lepiej zorganizowani niż konkurencja".',
    expected_impact_quantitative: 'Conversion lift z personalizacji + visual experience.',
    requires: {
      data: ['karty produktowe (z P-004)'],
      integrations_mcp: [],
      skills_to_write: ['/generate-presentation'],
      custom_tools: ['Static site service', 'tracking analytics'],
    },
    prerequisites: ['P-004'],
    example_skill_file_path: null,
  },
  {
    id: 'P-007',
    name: 'AI-Native Customer Onboarding Form',
    name_pl: 'Inteligentny formularz onboardingu klienta',
    one_liner:
      'Rejestracja klienta B2B z wymaganymi polami (KRS, link do sklepu, zdjęcie magazynu), automatyczna weryfikacja, kategoryzacja przy onboardingu.',
    industry_tags: ['off_price_fashion', 'b2b_wholesale'],
    cavac_layer: 'tools',
    solves_pain_categories: ['data_quality', 'lost_revenue'],
    solution_pattern:
      'Strona apply.stockhurt.eu z formularzem. Backend: scraping linków klienta (Allegro/OLX/strona) przez AI dla automatycznej charakterystyki: jakie marki sprzedają, jaki segment, jaka skala. Auto-tier assignment. Marketing attribution.',
    solution_pattern_pl: 'Strona apply.stockhurt.eu — formularz inspirowany Unfrozen: KRS, link do sklepu, zdjęcie magazynu. Backend automatycznie scrape linki klienta (Allegro/OLX), AI analizuje jakie marki sprzedają, w jakim segmencie. Auto-przypisanie tieru. Marketing wie skąd przychodzą klienci. Auto-routing do odpowiedniego handlowca.',
    effort_weeks: { min: 2, typical: 3, max: 4 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Każdy nowy klient od dnia 1 ma profil. Marketing wie skąd przychodzą. Auto-routing do handlowca.',
    expected_impact_quantitative:
      'Wzrost konwersji marketingowej, wzrost AOV (lepsza personalizacja).',
    requires: {
      data: ['definicja Tier 1/2/3 (z P-001)'],
      integrations_mcp: ['AppSheet write-MCP', 'Allegro public API'],
      skills_to_write: ['/qualify-new-client'],
      custom_tools: ['Application service', 'scraping module'],
    },
    prerequisites: ['P-001'],
    example_skill_file_path: null,
  },
  {
    id: 'P-008',
    name: 'Lead Enrichment & Outreach Pipeline',
    name_pl: 'Pipeline pozyskiwania leadów B2B',
    one_liner:
      'CAVAC-style lead generation: Google Maps scraping + ZoomInfo/Apollo enrichment + LinkedIn scraping + automated personalized outreach + dashboard z lifecycle leadem. Adaptowane do off-price fashion B2B.',
    industry_tags: ['b2b_outbound', 'off_price_fashion', 'universal_pattern'],
    cavac_layer: 'workflows',
    solves_pain_categories: [
      'manual_repetitive_work',
      'scaling_blocker',
      'lost_revenue',
    ],
    solution_pattern:
      'P1: Google Maps API + ICP queries → enrichment przez Apollo/ZoomInfo → AI evaluation. P2: per-lead deep enrichment, LinkedIn URL, znajdowanie decision makerów. P3: per-osoba spersonalizowany email/WhatsApp, A/B testing. P4: Dashboard funnel found → responded → transaction.',
    solution_pattern_pl: 'Czteroetapowy pipeline: Google Maps + ICP queries znajdują potencjalnych klientów, Apollo/ZoomInfo enrichment wzbogacają dane, AI wybiera decydentów (CO operacji, Sales Manager — nie info@), spersonalizowany outreach z A/B testingiem. Dashboard tracking od „znaleziony" do „transakcja". 5-10x lepsza response rate niż obecne 0.4%.',
    effort_weeks: { min: 6, typical: 10, max: 16 },
    effort_weeks_mvp: { typical: 4 },
    expected_impact_qualitative:
      'Top emotional priority foundera. To jest "to mnie naprawdę kurzy" pain — adresując go pokazujemy że słuchaliśmy.',
    expected_impact_quantitative:
      '5-10x improvement w response rate z 0.4% (DNB) do 4-8%. 3-5 nowych deali/miesiąc × 50k AOV = 150-250k revenue lift miesięcznie.',
    requires: {
      data: ['ICP definition workshop', 'dostęp do Apollo/ZoomInfo/DNB'],
      integrations_mcp: [
        'Google Maps API',
        'Apollo API',
        'LinkedIn scraping',
        'Gmail send',
      ],
      skills_to_write: [
        '/find-leads-ICP',
        '/enrich-lead',
        '/draft-personalized-outreach',
      ],
      custom_tools: ['Lead pipeline service', 'dashboard'],
    },
    prerequisites: ['P-001'],
    example_skill_file_path: null,
  },
  {
    id: 'P-009',
    name: 'Big-Grade-to-Lots Categorization',
    name_pl: 'Kategoryzacja big-grade na loty',
    one_liner:
      'Bot kategoryzujący przychodzący big-grade towar (bez listy pakunkowej) na podstawie zdjęć — automatycznie tworzy "lot" z opisem co jest w środku.',
    industry_tags: ['off_price_fashion', 'warehouse'],
    cavac_layer: 'tools',
    solves_pain_categories: ['data_quality', 'lost_revenue', 'scaling_blocker'],
    solution_pattern:
      'Magazynier robi zdjęcia palety. AI analizuje zdjęcia → identyfikuje brandy (logo recognition), kategorie, szacuje rozmiary. Generuje JSON listy pakunkowej + opis "lot". Replikujemy Allegro bot dla hurtu.',
    solution_pattern_pl: 'Magazynier robi zdjęcia palety. AI rozpoznaje brandy (logo recognition), kategorie odzieży, szacuje rozmiary. Generuje listę pakunkową i opis „lot" gotowy do sprzedaży jako paczka — model Unfrozen — zamiast „na kilo" z niską marżą. Odblokowuje 50%+ obecnego big-grade na wyższe marże.',
    effort_weeks: { min: 4, typical: 6, max: 10 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Odblokowuje endgame Unfrozen-like model dla 50%+ obecnego big-grade.',
    expected_impact_quantitative:
      'Big-grade dziś sprzedawane "na kilo" niskie marży; jako lots = +50-100% margin uplift.',
    requires: {
      data: ['dostęp do magazynu', 'próbka 100+ zdjęć palet', 'istniejący Allegro bot'],
      integrations_mcp: ['WMS write-MCP'],
      skills_to_write: ['/categorize-pallet', '/generate-lot-listing'],
      custom_tools: ['Vision processing service'],
    },
    prerequisites: ['P-001', 'P-004'],
    example_skill_file_path: null,
  },
  {
    id: 'P-010',
    name: 'Quality-Aware Pricing Engine',
    name_pl: 'Silnik wyceny świadomy jakości',
    one_liner:
      'Engine rekomendujący ceny dla nowo wprowadzanego stocku na podstawie historycznych sprzedaży, sezonowości, mix brandów, konkurencji (Unfrosen scraping).',
    industry_tags: ['off_price_fashion', 'pricing'],
    cavac_layer: 'tools',
    solves_pain_categories: ['lost_revenue', 'data_quality'],
    solution_pattern:
      'Dane: historia Allegro (co się sprzedaje, za ile, w jakim tempie), historia hurtu (marże). LLM analiza per kategoria × brand × sezon. Rekomendacja: minimum/target/premium margin. Per-deal pricing z uzasadnieniem.',
    solution_pattern_pl: 'Engine wycenia nowo wprowadzony stock na podstawie historycznych sprzedaży Allegro, sezonowości, mixu marek, cen konkurencji. AI per kategoria × marka × sezon rekomenduje: minimalna, docelowa, premium marża. Per deal: konkretna rekomendacja z uzasadnieniem.',
    effort_weeks: { min: 4, typical: 6, max: 10 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Bardziej świadome decyzje pricingowe, end of "ja-bym-strzelił" pricing.',
    expected_impact_quantitative:
      '3-7% margin improvement = przy 11M EUR revenue = 0.3-0.8M EUR/year.',
    requires: {
      data: ['historia Allegro 12m', 'historia hurtu 12m'],
      integrations_mcp: ['Allegro analytics', 'AppSheet read'],
      skills_to_write: ['/price-recommendation'],
      custom_tools: ['Analytics warehouse', 'pricing model'],
    },
    prerequisites: ['P-001', 'P-004'],
    example_skill_file_path: null,
  },
  {
    id: 'P-011',
    name: 'Daily Sales Briefing Skill',
    name_pl: 'Codzienny briefing handlowca',
    one_liner:
      'Skill /daily-briefing w Cowork — handlowiec rano dostaje listę: do kogo dzwonić, co odpowiedzieć w pending wątkach, jakie nowe leady wpadły, overdue follow-upy.',
    industry_tags: ['universal_pattern'],
    cavac_layer: 'skills',
    solves_pain_categories: ['lost_context', 'manual_repetitive_work'],
    solution_pattern:
      'Skill łączy P-002 client memory, P-008 leady, kalendarz. Generuje codzienny briefing prioritized lista akcji per handlowiec.',
    solution_pattern_pl: 'Każdego ranka handlowiec dostaje listę: do kogo dziś dzwonić (z pamięci klienta), co odpowiedzieć w wątkach WhatsApp, jakie nowe leady przyszły, którzy klienci są przeterminowani na follow-up. Start dnia z konkretami zamiast z chaosu Inboxa.',
    effort_weeks: { min: 1, typical: 2, max: 3 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Handlowiec startuje dzień z konkretną listą, nie z chaosu Inboxa/WhatsAppa.',
    expected_impact_quantitative: 'Pośrednio przez wzrost konwersji follow-upów.',
    requires: {
      data: ['client memory (P-002)', 'leady (P-008)'],
      integrations_mcp: [],
      skills_to_write: ['/daily-briefing'],
      custom_tools: [],
    },
    prerequisites: ['P-001', 'P-002', 'P-008'],
    example_skill_file_path: null,
  },
  {
    id: 'P-012',
    name: 'Edition Closing Skill',
    name_pl: 'Zamknięcie transakcji — automatyzacja',
    one_liner:
      'Replikacja "Edition Summary" Igora dla branży hurtowej. Po zamknięciu dużej transakcji: automatic summary, thank-you draft, notatka w CRM, planowane touchpointy, alert cross-sell.',
    industry_tags: ['off_price_fashion', 'universal_pattern'],
    cavac_layer: 'skills',
    solves_pain_categories: ['lost_context', 'customer_experience'],
    solution_pattern:
      'Po zamknięciu deala handlowiec uruchamia /close-edition {deal_id}. Skill generuje summary, thank-you message, ustawia follow-up reminders, sugeruje cross-sell na podstawie pattern matching.',
    solution_pattern_pl: 'Po zamknięciu transakcji handlowiec uruchamia „/close-edition". Automatyczne summary, draft thank-you message, notatka w CRM, zaplanowane punkty kontaktu w przyszłości, sugestie cross-sell. Domknięcie pętli po sprzedaży — klient zaopiekowany bez ręcznej pracy handlowca.',
    effort_weeks: { min: 1, typical: 2, max: 3 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Closing loop po transakcji — klient czuje się zaopiekowany, handlowiec ma less manual work.',
    expected_impact_quantitative: 'Retention lift trudny do bezpośredniego pomiaru.',
    requires: {
      data: ['historia transakcji', 'client memory (P-002)'],
      integrations_mcp: ['AppSheet MCP'],
      skills_to_write: ['/close-edition'],
      custom_tools: [],
    },
    prerequisites: ['P-001', 'P-002'],
    example_skill_file_path: null,
  },
  {
    id: 'P-013',
    name: 'Returns & Defects Sorting Skill',
    name_pl: 'Sortowanie zwrotów i defektów',
    one_liner:
      'Skill obsługujący sortowanie zwrotów i defektów — magazynier opisuje co widzi, agent decyduje kategoryzację, A-grade/B-grade routing, re-shipment.',
    industry_tags: ['off_price_fashion', 'warehouse'],
    cavac_layer: 'skills',
    solves_pain_categories: ['data_quality', 'manual_repetitive_work'],
    solution_pattern:
      'Magazynier mówi do mikrofonu lub robi zdjęcie. Skill klasyfikuje stan towaru, decyduje routing, generuje zapis w WMS, ewentualnie inicjuje re-shipment.',
    solution_pattern_pl: 'Magazynier mówi do mikrofonu lub robi zdjęcie zwracanego towaru. Skill klasyfikuje stan (A-grade/B-grade/big-grade), decyduje routing, generuje wpis w WMS, ewentualnie inicjuje re-shipment. Z „Ania wie co z tym zrobić" do reproducible procesu.',
    effort_weeks: { min: 2, typical: 3, max: 5 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Magazyn z tribal knowledge "Ania wie co z tym zrobić" do reproducible process.',
    expected_impact_quantitative: 'Recovery wartości z defektów które dziś idą "na kilo".',
    requires: {
      data: ['SOP sortowania', 'historyczne case-y'],
      integrations_mcp: ['WMS write-MCP'],
      skills_to_write: ['/sort-return', '/classify-defect'],
      custom_tools: [],
    },
    prerequisites: ['P-001', 'P-009'],
    example_skill_file_path: null,
  },
  {
    id: 'P-014',
    name: 'Reactivation Bot — Dormant Clients',
    name_pl: 'Reaktywacja uśpionych klientów',
    one_liner:
      'Cotygodniowy bot identyfikujący klientów którzy NIE kupili w ostatnich 60+ dniach i generujący propozycję personalizowanego reach-out z aktualnym matching stockiem.',
    industry_tags: ['universal_pattern', 'b2b_wholesale'],
    cavac_layer: 'workflows',
    solves_pain_categories: ['lost_revenue', 'customer_experience'],
    solution_pattern:
      'Cron weekly: query transakcji per klient → identyfikacja dormant (60+ dni bez zakupu) → match z aktualnym stockiem → personalized message draft → queue dla handlowca w briefingu.',
    solution_pattern_pl: 'Co tydzień bot identyfikuje klientów którzy nie kupili w ciągu 60+ dni (a wcześniej kupowali). Matchuje z aktualnym stockiem, generuje spersonalizowaną propozycję reach-outu. Wchodzi do briefingu handlowca. Systematyczne odzyskiwanie tracących się klientów zamiast „kurczę zapomnieliśmy".',
    effort_weeks: { min: 1, typical: 2, max: 3 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Systematyczne odzyskiwanie tracących się klientów zamiast "kurczę zapomnieliśmy o nim".',
    expected_impact_quantitative:
      'Reactywacja 10-15% dormant base × średni AOV = realny rev lift.',
    requires: {
      data: ['historia transakcji', 'aktualny stock'],
      integrations_mcp: ['AppSheet MCP', 'WMS MCP'],
      skills_to_write: ['/reactivate-dormant'],
      custom_tools: [],
    },
    prerequisites: ['P-001', 'P-002', 'P-005'],
    example_skill_file_path: null,
  },
  {
    id: 'P-015',
    name: 'Compliance & Anti-Leak Skill',
    name_pl: 'Filtr bezpieczeństwa wiadomości',
    one_liner:
      'Skill /check-before-send walidujący każdy outgoing email/WhatsApp message dla wycieków internal information (Tier 3 klient "wolny płatnik", wewnętrzna polityka rabatowa, comments handlowców).',
    industry_tags: ['universal_pattern'],
    cavac_layer: 'skills',
    solves_pain_categories: ['compliance_risk', 'tooling_friction'],
    solution_pattern:
      'Pre-send hook: skill skanuje treść wychodzącej wiadomości przez Brain "internal/" sekcje. Flag-uje frazy które mogą być internal-only. Suggeruje sanitized wersję.',
    solution_pattern_pl: 'Każda wychodząca wiadomość (email, WhatsApp) przepuszczana przez filtr — sprawdza czy nie wycieka informacja wewnętrzna: notatki o klientach „wolni płatnicy", wewnętrzna polityka rabatowa, komentarze handlowców. Jeśli ryzyko — sugeruje sanitized wersję przed wysłaniem.',
    effort_weeks: { min: 1, typical: 2, max: 3 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Zero accidental leak internal classifications/notes do klientów.',
    expected_impact_quantitative: 'Risk avoidance — value w nie-zdarzeniach.',
    requires: {
      data: ['definicje internal/ vs client-facing/ (z P-001)'],
      integrations_mcp: ['Gmail MCP', 'WhatsApp MCP'],
      skills_to_write: ['/check-before-send'],
      custom_tools: [],
    },
    prerequisites: ['P-001'],
    example_skill_file_path: null,
  },
  {
    id: 'P-016',
    name: 'End-to-End Shipment Processing Workflow',
    name_pl: 'Workflow obsługi dostawy end-to-end',
    one_liner:
      'Od "ciężarówka przyjechała" do "produkty na Allegro + w hurcie listing" — workflow orkiestrujący P-004 (cards), P-009 (categorization), P-010 (pricing), P-013 (sorting).',
    industry_tags: ['off_price_fashion', 'warehouse'],
    cavac_layer: 'workflows',
    solves_pain_categories: [
      'manual_repetitive_work',
      'data_quality',
      'scaling_blocker',
    ],
    solution_pattern:
      'Trigger: WMS notification "shipment arrived". Workflow odpala kolejno: sorting → categorization → pricing → card generation → listing. Każdy krok ma checkpoints dla human review jeśli confidence niska.',
    solution_pattern_pl: 'Od „ciężarówka przyjechała" do „produkty na Allegro i w hurcie": workflow orkiestruje wszystkie kroki — sortowanie, kategoryzacja, wycena, generowanie kart, listing. Z dni do godzin processing per dostawa. 3-5x większa przepustowość magazynu.',
    effort_weeks: { min: 2, typical: 4, max: 6 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Cały processing shipmentu od chaos do reproducible pipeline.',
    expected_impact_quantitative:
      'Czas processing per shipment z dni do godzin. Throughput wzrost 3-5x.',
    requires: {
      data: ['wszystkie z prerequisite plays'],
      integrations_mcp: ['WMS MCP', 'Allegro API'],
      skills_to_write: ['/process-shipment'],
      custom_tools: ['Workflow orchestrator'],
    },
    prerequisites: ['P-004', 'P-009', 'P-010', 'P-013'],
    example_skill_file_path: null,
  },
  {
    id: 'P-017',
    name: 'New Client Onboarding Workflow',
    name_pl: 'Workflow onboardingu nowego klienta',
    one_liner:
      'Od aplikacji w formularzu (P-007) → enrichment → tier assignment → routing do handlowca → automated welcome → first offer (P-005).',
    industry_tags: ['b2b_wholesale', 'universal_pattern'],
    cavac_layer: 'workflows',
    solves_pain_categories: ['data_quality', 'customer_experience'],
    solution_pattern:
      'Trigger: nowa aplikacja z P-007. Workflow: enrichment → AI tier classification → routing do handlowca o najmniejszym load → automated welcome message → schedule first offer call.',
    solution_pattern_pl: 'Od aplikacji w formularzu (P-007) → enrichment → przypisanie tieru → routing do handlowca o najmniejszym load → automatyczna wiadomość powitalna → zaplanowany pierwszy call ofertowy. Od „kogoś znamy" do reproducible 24-48h response time.',
    effort_weeks: { min: 2, typical: 3, max: 5 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Od onboarding "kogoś znamy" do reproducible 24-48h response time.',
    expected_impact_quantitative:
      'Wzrost konwersji onboarded → first-deal z baseline do ~50%+.',
    requires: {
      data: ['P-007 outputs'],
      integrations_mcp: ['AppSheet MCP', 'email/WhatsApp send'],
      skills_to_write: ['/onboard-client'],
      custom_tools: [],
    },
    prerequisites: ['P-005', 'P-007'],
    example_skill_file_path: null,
  },
  {
    id: 'P-018',
    name: 'Team Cowork Onboarding & Training',
    name_pl: 'Wdrożenie Cowork w zespole',
    one_liner:
      'Wdrożenie Cowork do zespołu nietechnicznego — onboarding doc, daily workflow training, skill discovery, first-week champion program.',
    industry_tags: ['universal_pattern'],
    cavac_layer: 'cowork',
    solves_pain_categories: [],
    solution_pattern:
      'Tygodniowa sesja onboarding + champion-of-the-week + skill discovery sessions. Champion program: 1 osoba/dział uczy się głębiej i pomaga reszcie.',
    solution_pattern_pl: 'Tygodniowe sesje onboardingowe dla nietechnicznego zespołu. Program „champion of the week" — jedna osoba z każdego działu uczy się głębiej i pomaga reszcie. Bez tego najlepsze wdrożenia leżą nieużywane. Cel: adoption rate z 20-30% do 70%+.',
    effort_weeks: { min: 1, typical: 2, max: 3 },
    effort_weeks_mvp: null,
    expected_impact_qualitative:
      'Bez tego najlepsze plays leżą nieużywane. Adopcja Cowork w zespole = warunek konieczny ROI.',
    expected_impact_quantitative:
      'Adoption rate z 20-30% (typowe bez onboardingu) do 70%+.',
    requires: {
      data: ['lista skill plików', 'lista członków zespołu'],
      integrations_mcp: [],
      skills_to_write: ['/cowork-intro'],
      custom_tools: [],
    },
    prerequisites: ['P-001', 'P-002', 'P-019', 'P-020', 'P-021'],
    example_skill_file_path: null,
  },
  {
    id: 'P-019',
    name: 'Market Intelligence Continuous Monitoring',
    name_pl: 'Monitoring rynku i konkurencji',
    one_liner:
      'Continuous monitoring konkurencji (Unfrosen, Faire, Ankorstore) + fashion industry signals (McKinsey, Retail Dive, off-price trends) + automatyczna detekcja istotnych zmian.',
    industry_tags: ['off_price_fashion', 'market_intelligence', 'founder_facing'],
    cavac_layer: 'founder-facing',
    solves_pain_categories: ['scaling_blocker', 'lost_context', 'knowledge_silos'],
    solution_pattern:
      'Crawler scrapowy (daily) na strony konkurencji — produkty, pricing, kampanie. RSS/API ingestion industry news. LLM klasyfikuje severity/relevance. Generuje MarketSignal entities. Founder dostaje weekly digest.',
    solution_pattern_pl: 'Codziennie crawler skanuje strony konkurentów (Unfrozen, Faire, Ankorstore) — nowe produkty, zmiany cen, kampanie. RSS i industry news o branży fashion off-price. AI klasyfikuje co ważne, generuje weekly digest dla zarządu: co się dzieje na rynku, co wymaga reakcji.',
    effort_weeks: { min: 3, typical: 5, max: 8 },
    effort_weeks_mvp: { typical: 3 },
    expected_impact_qualitative:
      'Founderzy odzyskują "uszy na rynku" bez manualnego śledzenia. Wczesne ostrzeżenia o Unfrosen moves.',
    expected_impact_quantitative:
      'Trudne bezpośrednio — value w lepszej kalibracji decyzji strategicznych blokujących 5% YoY decline.',
    requires: {
      data: ['lista konkurentów', 'lista trusted industry sources'],
      integrations_mcp: ['Firecrawl/Apify scraping', 'news API'],
      skills_to_write: [
        '/market-digest',
        '/competitor-snapshot',
        '/signal-analyze',
      ],
      custom_tools: ['scraping pipeline', 'signal classifier', 'digest generator'],
    },
    prerequisites: ['P-001'],
    example_skill_file_path: null,
  },
  {
    id: 'P-020',
    name: 'Founder Daily/Weekly Briefing',
    name_pl: 'Codzienny briefing dla zarządu',
    one_liner:
      'Continuous-running skill, który rano (daily) lub w poniedziałek (weekly) generuje founderowi briefing: co dzieje się operacyjnie + co na rynku + co krytyczne + co zlecić.',
    industry_tags: ['universal_pattern', 'founder_facing'],
    cavac_layer: 'founder-facing',
    solves_pain_categories: ['lost_context', 'scaling_blocker', 'communication_breakdown'],
    solution_pattern:
      'Skill w Cowork (lub email): ładuje aktualny stan metryk z ERP/CRM, recent market signals (P-019), aktywne action points (P-021), recent pains z handlowców (P-002). Generuje 1-stronicowy executive briefing.',
    solution_pattern_pl: 'Skill w Cowork, który rano (codziennie) lub w poniedziałek (cotygodniowo) ładuje: kluczowe metryki firmy z ERP/CRM, świeże sygnały z rynku, aktywne działania do zlecenia, pains zgłoszone przez handlowców. Generuje jednostronicowy briefing: top-3 idzie dobrze, top-3 wymaga uwagi, top-3 do zlecenia.',
    effort_weeks: { min: 2, typical: 3, max: 5 },
    effort_weeks_mvp: { typical: 2 },
    expected_impact_qualitative:
      'Founder odzyskuje pełny obraz w 5 minut rano. Nie musi przyjeżdżać żeby wiedzieć co się dzieje. Stagnacja 5% YoY zaczyna się odwracać.',
    expected_impact_quantitative:
      'Jeśli briefing pomaga uniknąć 1 strategicznego błędu/kwartał — payback wielokrotny.',
    requires: {
      data: ['ERP/CRM/WMS feeds', 'P-019 signals', 'P-002 memory'],
      integrations_mcp: ['ERP MCP', 'CRM MCP', 'Email'],
      skills_to_write: ['/daily-founder-briefing', '/weekly-strategic-update'],
      custom_tools: ['Briefing generator', 'email delivery'],
    },
    // MVP P-020 (weekly briefing) pulluje data z dowolnych źródeł. P-019 i P-021
    // są synergic enhancers, nie blockers. Pełen P-020 (daily briefing + strategic
    // alerts) naturalnie evolves po wdrożeniu P-019/P-021.
    prerequisites: ['P-001'],
    example_skill_file_path: null,
  },
  {
    id: 'P-021',
    name: 'Action Points Generator & Tracker',
    name_pl: 'Generator i tracker działań',
    one_liner:
      'Engine, który z każdej analizy (problem, ryzyko, sygnał z rynku, scoring opportunity) wyciąga konkretne action pointy z sugestią ownera i deadline. Pełen lifecycle.',
    industry_tags: ['universal_pattern', 'founder_facing'],
    cavac_layer: 'founder-facing',
    solves_pain_categories: ['scaling_blocker', 'manual_repetitive_work', 'communication_breakdown'],
    solution_pattern:
      'Po każdej analizie LLM generuje action points: "Z pain X wynika action Y dla ownera Z, deadline W". UI z filtrami, drag-and-drop assignacja, status tracking. Periodically re-evaluates overdue. Outcome tracking po completed.',
    solution_pattern_pl: 'Po każdej analizie (problem, ryzyko, sygnał z rynku, szansa) system generuje konkretne działania z proponowanym właścicielem i terminem. Pełen lifecycle: zasugerowane → przypisane → w toku → zrealizowane → śledzenie efektu. Founder dostaje obraz „co trzeba zrobić, komu zlecić, jak rozliczyć".',
    effort_weeks: { min: 3, typical: 4, max: 6 },
    effort_weeks_mvp: { typical: 3 },
    expected_impact_qualitative:
      'Operacyjny layer mózgu firmy — sygnały z dashboardu stają się akcjami. Closes gap między "wiem" a "robię".',
    expected_impact_quantitative:
      'Wzrost completion rate strategicznych inicjatyw foundera z ad-hoc do systematic.',
    requires: {
      data: ['pełen Knowledge Graph (problems, risks, signals)'],
      integrations_mcp: ['Notion/ClickUp (opcjonalnie)'],
      skills_to_write: [
        '/action-points-from-analysis',
        '/reassign-action',
        '/check-overdue-actions',
      ],
      custom_tools: ['Action point lifecycle service', 'tracker UI'],
    },
    prerequisites: ['P-001'],
    example_skill_file_path: null,
  },
];

// Validate every play at import time — if any drifts from AIPlaySchema, fail loud.
export const PLAYS: AIPlay[] = PLAYS_RAW.map((p, i) => {
  const r = AIPlaySchema.safeParse(p);
  if (!r.success) {
    throw new Error(
      `Play library entry #${i} (${p.id}) failed schema validation:\n${JSON.stringify(r.error.issues, null, 2)}`,
    );
  }
  return r.data;
});

export function getPlayById(id: string): AIPlay | undefined {
  return PLAYS.find((p) => p.id === id);
}
