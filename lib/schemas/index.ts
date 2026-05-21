import { z } from 'zod';

// ============= POMOCNICZE =============

export const SourceQuoteSchema = z.object({
  text: z.string().describe('Dokładny cytat ze źródła, max 200 znaków'),
  source: z.enum(['transcript', 'document', 'export', 'inferred']),
  speaker: z.string().nullable().describe('Kto powiedział, jeśli transcript'),
  timestamp: z.string().nullable().describe('Pozycja w transcript jeśli dostępne'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Pewność ekstrakcji'),
});
export type SourceQuote = z.infer<typeof SourceQuoteSchema>;

export const MoneyAmountSchema = z.object({
  value: z.number(),
  currency: z.enum(['PLN', 'EUR', 'USD']),
  period: z.enum(['one-time', 'daily', 'weekly', 'monthly', 'yearly']).nullable(),
});
export type MoneyAmount = z.infer<typeof MoneyAmountSchema>;

// ============= FIRMA =============

export const CompanyProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  anonymized_name: z.string().describe('Bezpieczna nazwa do prezentacji'),
  industry: z.string(),
  sub_industry: z.string().nullable(),
  business_model: z.string().describe('1-2 zdania jak firma zarabia'),
  revenue_estimate: MoneyAmountSchema.nullable(),
  revenue_breakdown: z.record(z.string(), z.number()).nullable()
    .describe('np. {hurt_B2B: 0.6, detal_marketplace: 0.4}'),
  employee_count_estimate: z.number().nullable(),
  years_in_business: z.number().nullable(),
  geo_markets: z.array(z.string()),
  source_quotes: z.array(SourceQuoteSchema),
});
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

// ============= PROCESY =============

export const ProcessSchema = z.object({
  id: z.string(),
  name: z.string().describe("Krótka nazwa procesu, np. 'Ofertowanie B2B'"),
  description: z.string().describe('2-4 zdania jak proces przebiega dziś'),
  category: z.enum([
    'sales',
    'operations',
    'customer_success',
    'marketing',
    'finance',
    'logistics',
    'product',
    'hr',
    'data_management',
  ]),
  current_owner_role: z.string().describe("Rola wykonująca, np. 'Handlowiec'"),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'ad_hoc']),
  estimated_hours_per_execution: z.number().nullable(),
  estimated_executions_per_month: z.number().nullable(),
  tools_used: z.array(z.string()).describe('IDs Toolów'),

  knowledge_ready: z.object({
    score: z.number().min(0).max(10),
    reasoning: z.string(),
    gaps: z.array(z.string()),
  }).describe('Czy wiedza o procesie jest spisana?'),

  tools_ready: z.object({
    score: z.number().min(0).max(10),
    reasoning: z.string(),
    gaps: z.array(z.string()),
  }).describe('Czy istnieją systemy do operowania procesem?'),

  integration_ready: z.object({
    score: z.number().min(0).max(10),
    reasoning: z.string(),
    missing_mcp: z.array(z.string()).describe('Lista brakujących integracji MCP'),
  }),

  skill_ready: z.object({
    score: z.number().min(0).max(10),
    reasoning: z.string(),
    is_repeatable: z.boolean(),
    is_describable: z.boolean(),
  }),

  depends_on: z.array(z.string()).describe('IDs procesów wymaganych'),
  enables: z.array(z.string()).describe('IDs procesów odblokowywanych'),

  source_quotes: z.array(SourceQuoteSchema),
});
export type Process = z.infer<typeof ProcessSchema>;

// ============= PAIN POINTS =============

export const PainSchema = z.object({
  id: z.string(),
  title: z.string().describe('Jednozdaniowe streszczenie'),
  description: z.string(),
  category: z.enum([
    'time_waste',
    'manual_repetitive_work',
    'knowledge_silos',
    'lost_context',
    'data_quality',
    'communication_breakdown',
    'tooling_friction',
    'lost_revenue',
    'customer_experience',
    'compliance_risk',
    'scaling_blocker',
  ]),

  affected_processes: z.array(z.string()).describe('IDs Processów'),
  affected_roles: z.array(z.string()),

  frequency: z.enum(['constant', 'daily', 'weekly', 'monthly', 'occasional']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  strategic_impact: z.enum(['blocks_endgame', 'major', 'moderate', 'minor']),

  founder_emotional_intensity: z.enum(['burning', 'frustrating', 'mentioned', 'background']),
  founder_quoted_phrase: z.string().nullable()
    .describe("Cytat typu 'najbardziej mnie wkurza', 'nie mogę spać przez to'"),

  source_quotes: z.array(SourceQuoteSchema),
});
export type Pain = z.infer<typeof PainSchema>;

// ============= METRYKI =============

export const MetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['volume', 'time', 'money', 'rate', 'count', 'quality']),
  current_value: z.union([z.number(), z.string()]),
  unit: z.string(),
  context: z.string().describe('Co ta liczba oznacza w kontekście biznesu'),
  related_processes: z.array(z.string()),
  benchmark_estimate: z.union([z.number(), z.string()]).nullable()
    .describe('Co byłoby reasonable po wdrożeniu'),
  source_quotes: z.array(SourceQuoteSchema),
});
export type Metric = z.infer<typeof MetricSchema>;

// ============= RYZYKA =============

export const RiskSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum([
    'competitive',
    'market',
    'technological',
    'operational',
    'financial',
    'regulatory',
    'talent',
    'concentration',
  ]),
  description: z.string(),

  time_horizon: z.enum([
    'imminent_3_months',
    'near_term_6_12_months',
    'medium_term_1_2_years',
    'long_term_2_plus_years',
  ]),

  probability: z.enum(['certain', 'likely', 'possible', 'unlikely']),
  impact: z.enum(['existential', 'major', 'moderate', 'minor']),

  specific_actors: z.array(z.string()).nullable()
    .describe("Konkretni gracze, np. 'Unfrosen', 'Faire'"),

  mitigation_status: z.enum(['none', 'planned', 'in_progress', 'partial']),

  source_quotes: z.array(SourceQuoteSchema),
});
export type Risk = z.infer<typeof RiskSchema>;

// ============= TOOLE / SYSTEMY =============

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    'crm',
    'wms',
    'erp',
    'spreadsheet',
    'comms',
    'marketplace',
    'documentation',
    'analytics',
    'automation',
    'ai',
    'custom_built',
  ]),
  vendor: z.string().nullable(),
  is_custom: z.boolean().describe('Czy zbudowane własnymi siłami / vibe-coded'),

  used_in_processes: z.array(z.string()),
  used_by_roles: z.array(z.string()),

  satisfaction: z.enum(['critical_friction', 'works_but_painful', 'adequate', 'loved']),

  has_api: z.boolean().nullable(),
  has_mcp: z.boolean().nullable(),
  data_quality: z.enum(['structured', 'semi_structured', 'unstructured']).nullable(),

  switching_cost: z.enum(['low', 'medium', 'high', 'extreme']),

  source_quotes: z.array(SourceQuoteSchema),
});
export type Tool = z.infer<typeof ToolSchema>;

// ============= ROLE / STAKEHOLDERS =============

export const StakeholderSchema = z.object({
  id: z.string(),
  role: z.string(),
  name: z.string().nullable(),
  is_decision_maker: z.boolean(),
  primary_concerns: z.array(z.string()),
  emotional_signal: z.string().nullable()
    .describe("Co tę osobę 'kurzy', podekscytowuje, frustruje"),
  source_quotes: z.array(SourceQuoteSchema),
});
export type Stakeholder = z.infer<typeof StakeholderSchema>;

// ============= KONKURENCJA =============

export const CompetitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string().describe('Krótko jak konkurują'),

  threat_level: z.enum(['existential', 'high', 'medium', 'low', 'irrelevant']),
  time_to_react: z.enum(['immediate', '3_6_months', '6_12_months', '1_year_plus']),

  scale_estimate: z.object({
    revenue: MoneyAmountSchema.nullable(),
    customers: z.number().nullable(),
    geo_reach: z.array(z.string()).nullable(),
    growth_rate: z.string().nullable(),
  }),

  key_advantages: z.array(z.string()),
  key_disadvantages: z.array(z.string()),

  positioning: z.object({
    inventory_model: z.enum(['holds_stock', 'pure_marketplace', 'hybrid']),
    revenue_model: z.enum(['margin', 'commission', 'subscription', 'hybrid']),
    target_customer: z.string(),
    geographic_reach: z.string(),
    tech_stack_visibility: z.string(),
  }),

  source_quotes: z.array(SourceQuoteSchema),
});
export type Competitor = z.infer<typeof CompetitorSchema>;

// ============= MARKET SIGNAL =============

export const MarketSignalSchema = z.object({
  id: z.string(),
  detected_at: z.string().describe('ISO timestamp wykrycia'),
  source: z.enum([
    'competitor_website',
    'industry_news',
    'social_media',
    'fashion_industry_report',
    'pricing_observation',
    'allegro_market_data',
    'other',
  ]),
  source_url: z.string().nullable(),
  signal_type: z.enum([
    'competitor_move',
    'pricing_change',
    'new_market_entrant',
    'industry_trend',
    'regulatory_change',
    'supplier_signal',
    'customer_segment_shift',
  ]),
  title: z.string(),
  description: z.string(),
  affects_competitors: z.array(z.string()).describe('IDs Competitor entities'),
  implications_for_company: z.string().describe('Co to oznacza dla naszej firmy'),
  suggested_actions: z.array(z.string()).describe('IDs of ActionPoints generated'),
  severity: z.enum(['informational', 'noteworthy', 'urgent', 'critical']),
  confidence: z.enum(['confirmed', 'likely', 'unverified']),
});
export type MarketSignal = z.infer<typeof MarketSignalSchema>;

// ============= ACTION POINT =============

export const ActionPointSchema = z.object({
  id: z.string(),
  generated_at: z.string(),
  generated_from: z.array(z.string()).describe('Co to wygenerowało — IDs Pains/Risks/Signals/Opportunities'),

  title: z.string().describe('Krótka nazwa działania, max 80 znaków'),
  description: z.string().describe('2-4 zdania co konkretnie zrobić i dlaczego'),

  category: z.enum([
    'sales_operations',
    'marketing',
    'data_quality',
    'team_management',
    'tooling',
    'strategy',
    'compliance',
    'finance',
    'partnerships',
    'product',
  ]),

  urgency: z.enum(['urgent', 'soon', 'this_quarter', 'when_possible']),
  importance: z.enum(['critical', 'high', 'medium', 'low']),

  estimated_effort: z.enum(['<1h', '1-4h', 'half_day', '1-2_days', '1_week', '1+_weeks']),

  suggested_owner_role: z.string().describe("Sugerowana rola, np. 'Head of Sales'"),
  suggested_owner_name: z.string().nullable().describe('Sugerowana osoba jeśli wiemy'),
  current_assignment: z.object({
    assigned_to: z.string().nullable(),
    assigned_at: z.string().nullable(),
    assigned_by: z.string().nullable(),
  }).nullable(),

  status: z.enum(['suggested', 'assigned', 'in_progress', 'completed', 'dismissed', 'overdue']),
  due_date: z.string().nullable(),
  completed_at: z.string().nullable(),

  outcome: z.string().nullable().describe('Co osiągnięto po zamknięciu'),
  outcome_metrics: z.array(z.object({
    metric: z.string(),
    before: z.string(),
    after: z.string(),
  })).nullable(),

  rationale: z.string().describe('Dlaczego ten action point został zasugerowany'),
  source_quotes: z.array(SourceQuoteSchema),
});
export type ActionPoint = z.infer<typeof ActionPointSchema>;

// ============= AI PLAY =============

export const AIPlaySchema = z.object({
  id: z.string(),
  name: z.string(),
  name_pl: z.string().nullable().describe('Polska, klient-facing nazwa wdrożenia'),
  one_liner: z.string(),

  industry_tags: z.array(z.string()),
  cavac_layer: z.enum(['brain', 'tools', 'skills', 'workflows', 'cowork', 'founder-facing']),

  solves_pain_categories: z.array(z.string()),
  solution_pattern: z.string().describe('3-5 zdań jak działa'),
  solution_pattern_pl: z.string().nullable().describe('Polski opis działania, klient-facing'),

  effort_weeks: z.object({
    min: z.number(),
    typical: z.number(),
    max: z.number(),
  }),

  effort_weeks_mvp: z.object({
    typical: z.number(),
  }).nullable().describe(
    'MVP variant — krótszy timeline, 60-80% value z full. Używany w selektor pierwszego pakietu. Null = nie ma sensownego MVP variant, używaj effort_weeks.',
  ),

  expected_impact_qualitative: z.string(),
  expected_impact_quantitative: z.string().nullable(),

  requires: z.object({
    data: z.array(z.string()),
    integrations_mcp: z.array(z.string()),
    skills_to_write: z.array(z.string()),
    custom_tools: z.array(z.string()),
  }),

  prerequisites: z.array(z.string()).describe('IDs innych plays lub abstract requirements'),

  example_skill_file_path: z.string().nullable()
    .describe('Ścieżka do draftu skill file w prototypie'),
});
export type AIPlay = z.infer<typeof AIPlaySchema>;

// ============= PLAY MATCH =============

export const PlayMatchSchema = z.object({
  play_id: z.string(),
  matched_pains: z.array(z.string()),

  business_impact_score: z.number().min(0).max(10),
  ai_fit_score: z.number().min(0).max(10),
  implementation_ease_score: z.number().min(0).max(10),
  data_readiness_score: z.number().min(0).max(10),

  cavac_readiness: z.object({
    knowledge: z.number().min(0).max(10),
    tools: z.number().min(0).max(10),
    skills: z.number().min(0).max(10),
    integrations: z.number().min(0).max(10),
    composite: z.number().min(0).max(10),
  }),

  composite_score: z.number().min(0).max(100),

  estimated_effort_weeks: z.number(),
  estimated_impact_pln_monthly: z.number().nullable(),

  confidence: z.enum(['high', 'medium', 'low']),
  uncertainty_factors: z.array(z.string()),

  reasoning: z.string().describe('2-4 zdania uzasadnienia rankingu'),
  caveats: z.array(z.string()),
});
export type PlayMatch = z.infer<typeof PlayMatchSchema>;

// ============= NEXT STEP PACK =============

export const NextStepPackSchema = z.object({
  id: z.string(),
  title: z.string(),
  one_liner: z.string(),

  selected_plays: z.array(z.string()).describe('IDs wybranych do pakietu'),

  framing: z.enum(['sidequest', 'foundation', 'pilot', 'endgame_phase']),
  rationale: z.string(),

  scope: z.object({
    in_scope: z.array(z.string()),
    out_of_scope: z.array(z.string()),
  }),

  timeline_weeks: z.number(),
  pricing: z.object({
    range_pln: z.tuple([z.number(), z.number()]),
    model: z.enum(['fixed', 't_and_m', 'milestone_based']),
    payment_terms: z.string(),
  }).nullable(),

  deliverables: z.array(z.string()),
  success_metrics: z.array(z.object({
    metric: z.string(),
    baseline: z.string(),
    target: z.string(),
    measurement_method: z.string(),
  })),

  team_required: z.array(z.string()),
  client_commitment: z.array(z.string()),

  risks_and_assumptions: z.array(z.string()),
  next_logical_step_after: z.string().describe('Co po sukcesie tego pakietu'),
});
export type NextStepPack = z.infer<typeof NextStepPackSchema>;

// ============= ANALIZA KOMPLETNA =============

export const CompanyAnalysisSchema = z.object({
  metadata: z.object({
    case_id: z.string(),
    generated_at: z.string(),
    pipeline_version: z.string(),
    input_sources: z.array(z.object({
      type: z.string(),
      identifier: z.string(),
      token_count: z.number().nullable(),
    })),
  }),

  company: CompanyProfileSchema,
  processes: z.array(ProcessSchema),
  pains: z.array(PainSchema),
  risks: z.array(RiskSchema),
  metrics: z.array(MetricSchema),
  tools: z.array(ToolSchema),
  stakeholders: z.array(StakeholderSchema),
  competitors: z.array(CompetitorSchema),
  market_signals: z.array(MarketSignalSchema),

  play_matches: z.array(PlayMatchSchema),
  ranked_opportunities: z.array(z.string()).describe('Top N play_match IDs'),

  action_points: z.array(ActionPointSchema),

  next_step_pack: NextStepPackSchema,

  last_continuous_refresh: z.string().nullable().describe('Kiedy ostatnio refreshed continuous data'),
  ingestion_sources_active: z.array(z.string()).describe('Które ingestion connectors są obecnie aktywne'),

  overall_confidence: z.enum(['high', 'medium', 'low']),
  data_gaps: z.array(z.string()).describe('Co musielibyśmy zobaczyć dla lepszej diagnozy'),
  followup_questions: z.array(z.string()),
});
export type CompanyAnalysis = z.infer<typeof CompanyAnalysisSchema>;
