import type {
  AIPlay,
  CompanyProfile,
  Pain,
  PlayMatch,
  Process,
  Tool,
} from '@/lib/schemas';
import type { ProblemScoreBreakdown } from './problem-score';

export interface OpportunityScoreBreakdown {
  play_id: string;
  final_score_0_100: number;
  components: {
    business_impact: { value: number; weight: number };
    ai_fit: { value: number; weight: number };
    cavac_readiness: {
      knowledge: number;
      tools: number;
      integrations: number;
      skills: number;
      composite: number;
      weight: number;
    };
    implementation_ease: { value: number; weight: number };
    data_readiness: { value: number; weight: number };
  };
  cavac_gaps_blocking: string[];
  formula: string;
}

const WEIGHTS = {
  businessImpact: 0.3,
  aiFit: 0.15,
  cavacReadiness: 0.25,
  implementationEase: 0.15,
  dataReadiness: 0.15,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function computeBusinessImpact(
  matchedPainIds: string[],
  problemScores: Map<string, ProblemScoreBreakdown>,
): number {
  if (matchedPainIds.length === 0) return 0;
  const scores = matchedPainIds
    .map((id) => problemScores.get(id)?.final_score_0_100 ?? 0)
    .sort((a, b) => b - a);
  // Top pain dominates, others contribute diminishingly.
  const top = scores[0] ?? 0;
  const tail = scores.slice(1).reduce((acc, s, i) => acc + s / (i + 2), 0);
  const composite = top + tail * 0.3;
  return clamp(composite / 10, 0, 10);
}

function computeAIFit(play: AIPlay, matchedPains: Pain[]): number {
  let score = 5;
  // LLM-heavy patterns score higher.
  const aiHeavy =
    play.solution_pattern.toLowerCase().match(/llm|ai |gpt|claude|model|vision|extract/g) ??
    [];
  score += clamp(aiHeavy.length * 0.6, 0, 3);
  // Skills-to-write count signals automatable judgment work.
  score += clamp(play.requires.skills_to_write.length * 0.3, 0, 1.5);
  // Pure tooling-friction pains are usually NOT AI fits.
  const friction = matchedPains.filter(
    (p) => p.category === 'tooling_friction',
  ).length;
  score -= friction * 0.4;
  return clamp(score, 0, 10);
}

function computeKnowledgeReadiness(
  processes: Process[],
  matchedPains: Pain[],
): number {
  const relevantProcessIds = new Set(
    matchedPains.flatMap((p) => p.affected_processes),
  );
  const relevant = processes.filter((p) => relevantProcessIds.has(p.id));
  if (relevant.length === 0) {
    // No anchor — use mean of all processes as proxy.
    if (processes.length === 0) return 3;
    return (
      processes.reduce((a, p) => a + p.knowledge_ready.score, 0) /
      processes.length
    );
  }
  return (
    relevant.reduce((a, p) => a + p.knowledge_ready.score, 0) / relevant.length
  );
}

function computeToolsReadiness(tools: Tool[], requiredCustom: string[]): number {
  if (requiredCustom.length === 0) {
    // No custom tools required — readiness depends on average tool satisfaction.
    if (tools.length === 0) return 5;
    const satMap: Record<Tool['satisfaction'], number> = {
      loved: 9,
      adequate: 7,
      works_but_painful: 4,
      critical_friction: 2,
    };
    return tools.reduce((a, t) => a + satMap[t.satisfaction], 0) / tools.length;
  }
  // Custom tools needed → readiness lower, scaled by how many.
  const base = 6;
  return clamp(base - requiredCustom.length * 0.8, 0, 10);
}

function computeIntegrationsReadiness(
  tools: Tool[],
  requiredMcp: string[],
): number {
  if (requiredMcp.length === 0) return 9;
  // Check coverage: how many required integrations have an existing tool with API or MCP.
  const haveApi = tools.filter((t) => t.has_api || t.has_mcp).length;
  const coverage = clamp(haveApi / Math.max(1, requiredMcp.length), 0, 1);
  return clamp(2 + coverage * 7 - (requiredMcp.length - haveApi) * 0.4, 0, 10);
}

function computeSkillsReadiness(
  processes: Process[],
  skillsToWrite: string[],
): number {
  // Skill readiness ~ average process skill_ready. Plus penalty for many skills required.
  if (processes.length === 0) return 5;
  const mean =
    processes.reduce((a, p) => a + p.skill_ready.score, 0) / processes.length;
  return clamp(mean - Math.max(0, skillsToWrite.length - 2) * 0.5, 0, 10);
}

function computeDataReadiness(
  requiredData: string[],
  tools: Tool[],
): number {
  if (requiredData.length === 0) return 9;
  const structuredTools = tools.filter(
    (t) => t.data_quality === 'structured',
  ).length;
  const semiStructured = tools.filter(
    (t) => t.data_quality === 'semi_structured',
  ).length;
  const dataBase = structuredTools * 1.5 + semiStructured * 0.8;
  return clamp(2 + dataBase - requiredData.length * 0.3, 0, 10);
}

function identifyCavacGaps(
  knowledge: number,
  tools: number,
  integrations: number,
  skills: number,
): string[] {
  const gaps: string[] = [];
  if (knowledge < 4) gaps.push('knowledge: procesy nieudokumentowane');
  if (tools < 4) gaps.push('tools: brak narzędzi lub krytyczna friction');
  if (integrations < 4) gaps.push('integrations: brakujące MCP / API');
  if (skills < 4) gaps.push('skills: procesy słabo opisywalne jako skill');
  return gaps;
}

export type StrategicPhase =
  | 'early_startup'
  | 'growth'
  | 'mid_growth_trap'
  | 'mature'
  | 'scaling';

export function calculateAIOpportunityScore(
  play: AIPlay,
  matchedPains: Pain[],
  problemScores: Map<string, ProblemScoreBreakdown>,
  _company: CompanyProfile,
  processes: Process[],
  tools: Tool[],
  strategicPhase: StrategicPhase = 'mid_growth_trap',
): OpportunityScoreBreakdown {
  const businessImpact = computeBusinessImpact(
    matchedPains.map((p) => p.id),
    problemScores,
  );
  const aiFit = computeAIFit(play, matchedPains);

  const knowledge = computeKnowledgeReadiness(processes, matchedPains);
  const toolsR = computeToolsReadiness(tools, play.requires.custom_tools);
  const integrations = computeIntegrationsReadiness(
    tools,
    play.requires.integrations_mcp,
  );
  const skills = computeSkillsReadiness(processes, play.requires.skills_to_write);

  const cavacComposite = (knowledge + toolsR + integrations + skills) / 4;
  const implementationEase = clamp(10 - play.effort_weeks.typical, 0, 10);
  const dataReadiness = computeDataReadiness(play.requires.data, tools);

  const composite =
    WEIGHTS.businessImpact * businessImpact +
    WEIGHTS.aiFit * aiFit +
    WEIGHTS.cavacReadiness * cavacComposite +
    WEIGHTS.implementationEase * implementationEase +
    WEIGHTS.dataReadiness * dataReadiness;

  const baseFinal = clamp(Math.round(composite * 10), 0, 100);
  const founderBoost =
    strategicPhase === 'mid_growth_trap' && play.cavac_layer === 'founder-facing'
      ? 10
      : 0;
  const finalScore = clamp(baseFinal + founderBoost, 0, 100);

  return {
    play_id: play.id,
    final_score_0_100: finalScore,
    components: {
      business_impact: { value: businessImpact, weight: WEIGHTS.businessImpact },
      ai_fit: { value: aiFit, weight: WEIGHTS.aiFit },
      cavac_readiness: {
        knowledge,
        tools: toolsR,
        integrations,
        skills,
        composite: cavacComposite,
        weight: WEIGHTS.cavacReadiness,
      },
      implementation_ease: {
        value: implementationEase,
        weight: WEIGHTS.implementationEase,
      },
      data_readiness: {
        value: dataReadiness,
        weight: WEIGHTS.dataReadiness,
      },
    },
    cavac_gaps_blocking: identifyCavacGaps(
      knowledge,
      toolsR,
      integrations,
      skills,
    ),
    formula: '0.3·BI + 0.15·AI + 0.25·CAVAC + 0.15·Ease + 0.15·Data',
  };
}

export function playMatchFromBreakdown(
  play: AIPlay,
  matchedPainIds: string[],
  breakdown: OpportunityScoreBreakdown,
  estimatedImpactPlnMonthly: number | null,
  problemScores: Map<string, ProblemScoreBreakdown>,
): PlayMatch {
  const c = breakdown.components;
  const confidence: PlayMatch['confidence'] =
    c.cavac_readiness.composite >= 7
      ? 'high'
      : c.cavac_readiness.composite >= 4
        ? 'medium'
        : 'low';

  const topPainScore = Math.max(
    0,
    ...matchedPainIds.map((id) => problemScores.get(id)?.final_score_0_100 ?? 0),
  );

  return {
    play_id: play.id,
    matched_pains: matchedPainIds,
    business_impact_score: Number(c.business_impact.value.toFixed(2)),
    ai_fit_score: Number(c.ai_fit.value.toFixed(2)),
    implementation_ease_score: Number(c.implementation_ease.value.toFixed(2)),
    data_readiness_score: Number(c.data_readiness.value.toFixed(2)),
    cavac_readiness: {
      knowledge: Number(c.cavac_readiness.knowledge.toFixed(2)),
      tools: Number(c.cavac_readiness.tools.toFixed(2)),
      integrations: Number(c.cavac_readiness.integrations.toFixed(2)),
      skills: Number(c.cavac_readiness.skills.toFixed(2)),
      composite: Number(c.cavac_readiness.composite.toFixed(2)),
    },
    composite_score: breakdown.final_score_0_100,
    estimated_effort_weeks: play.effort_weeks.typical,
    estimated_impact_pln_monthly: estimatedImpactPlnMonthly,
    confidence,
    uncertainty_factors: breakdown.cavac_gaps_blocking,
    reasoning: `${matchedPainIds.length} pain(s) matched, top problem score ${topPainScore}. CAVAC composite ${c.cavac_readiness.composite.toFixed(1)}/10, ${play.effort_weeks.typical}w typical effort.`,
    caveats: breakdown.cavac_gaps_blocking,
  };
}
