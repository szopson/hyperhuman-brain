/**
 * HyperHuman Brain — MCP Server
 *
 * Exposes the brain as infrastructure callable by AI agents (Claude Desktop,
 * Claude Code, custom workflows). Demonstrates the "AI System Lead" mindset:
 * the brain is not just a dashboard — it's a tool surface for other agents.
 *
 * Tools exposed:
 *   - list_pains(case_id?, category?, min_score?) — pains with scores
 *   - list_risks(case_id?, horizon?) — risks with severity
 *   - get_play(play_id) — full play match details
 *   - get_source_quote(entity_id) — verbatim quotes backing an entity
 *   - get_next_step_pack(case_id?) — recommended pack
 *
 * Usage:
 *   npm run mcp                            # stdio transport (Claude Desktop)
 *   claude mcp add hyperhuman-brain ...    # register with Claude Code
 *
 * Config snippet for Claude Desktop (~/.config/Claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "hyperhuman-brain": {
 *         "command": "npx",
 *         "args": ["tsx", "/absolute/path/scripts/mcp-server.ts"]
 *       }
 *     }
 *   }
 */

import fs from 'node:fs';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { CompanyAnalysisSchema, type CompanyAnalysis } from '../lib/schemas';
import { computeAllScores } from '../lib/scoring';

const DEFAULT_CASE = 'stock-hurt';
const AVAILABLE_CASES = ['stock-hurt', 'hyperhuman'];

function loadCase(caseSlug: string): CompanyAnalysis {
  const p = path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/analysis-full.json');
  if (!fs.existsSync(p)) throw new Error(`Unknown case: ${caseSlug}`);
  return CompanyAnalysisSchema.parse(JSON.parse(fs.readFileSync(p, 'utf8')));
}

const server = new McpServer({
  name: 'hyperhuman-brain',
  version: '0.2.0',
});

server.registerTool(
  'list_pains',
  {
    title: 'List pains in the brain',
    description:
      'Zwraca painy (problemy biznesowe) z mózgu firmy razem z problem_score, kategorią i source quotes. Każdy pain ma deterministyczny scoring z formuły freq × sev × strat × emotional × coverage.',
    inputSchema: {
      case_id: z
        .enum(AVAILABLE_CASES as [string, ...string[]])
        .default(DEFAULT_CASE)
        .describe('Slug case-a (stock-hurt | hyperhuman)'),
      category: z.string().optional().describe('Filtr po pain.category (np. tooling_friction)'),
      min_score: z.number().min(0).max(100).default(0).describe('Minimum problem_score'),
    },
  },
  async ({ case_id, category, min_score }) => {
    const a = loadCase(case_id);
    const { problem_scores } = computeAllScores(a);
    const rows = a.pains
      .map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        severity: p.severity,
        emotion: p.founder_emotional_intensity,
        problem_score: problem_scores.get(p.id)?.final_score_0_100 ?? 0,
        quote_count: p.source_quotes.length,
      }))
      .filter((r) => r.problem_score >= min_score)
      .filter((r) => !category || r.category === category)
      .sort((x, y) => y.problem_score - x.problem_score);
    return {
      content: [{ type: 'text', text: JSON.stringify({ case_id, pains: rows }, null, 2) }],
    };
  },
);

server.registerTool(
  'list_risks',
  {
    title: 'List risks in the brain',
    description:
      'Zwraca ryzyka z mózgu firmy z severity score (formuła: prob × impact × horizon × mitigation × 100).',
    inputSchema: {
      case_id: z
        .enum(AVAILABLE_CASES as [string, ...string[]])
        .default(DEFAULT_CASE),
      horizon: z
        .enum(['imminent_3_months', 'near_term_6_12_months', 'medium_term_1_2_years', 'long_term_2_plus_years'])
        .optional()
        .describe('Filtr po time_horizon'),
    },
  },
  async ({ case_id, horizon }) => {
    const a = loadCase(case_id);
    const { risk_scores } = computeAllScores(a);
    const rows = a.risks
      .filter((r) => !horizon || r.time_horizon === horizon)
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        horizon: r.time_horizon,
        probability: r.probability,
        impact: r.impact,
        mitigation: r.mitigation_status,
        severity_score: risk_scores.get(r.id)?.severity_score_0_100 ?? 0,
      }))
      .sort((x, y) => y.severity_score - x.severity_score);
    return {
      content: [{ type: 'text', text: JSON.stringify({ case_id, risks: rows }, null, 2) }],
    };
  },
);

server.registerTool(
  'get_play',
  {
    title: 'Get full AI play match details',
    description:
      'Zwraca pełne dane konkretnego play match: scores (BI, AI fit, ease, data readiness, CAVAC composite), pains matched, effort weeks, reasoning, caveats.',
    inputSchema: {
      case_id: z
        .enum(AVAILABLE_CASES as [string, ...string[]])
        .default(DEFAULT_CASE),
      play_id: z.string().describe('ID play (np. P-001, P-019, P-021)'),
    },
  },
  async ({ case_id, play_id }) => {
    const a = loadCase(case_id);
    const match = a.play_matches.find((m) => m.play_id === play_id);
    if (!match) {
      return {
        content: [{ type: 'text', text: `Play ${play_id} not matched in case ${case_id}` }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(match, null, 2) }] };
  },
);

server.registerTool(
  'get_source_quote',
  {
    title: 'Get verbatim source quotes backing an entity',
    description:
      'Zwraca DOKŁADNE cytaty z transkryptu / dokumentów które stoją za encją (pain/risk/process). Kluczowy tool anty-halucynacyjny — każde twierdzenie agenta powinno być oparte o cytaty z tego endpointu.',
    inputSchema: {
      case_id: z
        .enum(AVAILABLE_CASES as [string, ...string[]])
        .default(DEFAULT_CASE),
      entity_id: z.string().describe('ID encji (pain-*, risk-*, proc-*)'),
    },
  },
  async ({ case_id, entity_id }) => {
    const a = loadCase(case_id);
    const all = [
      ...a.pains.map((p) => ({ id: p.id, kind: 'pain', title: p.title, quotes: p.source_quotes })),
      ...a.risks.map((r) => ({ id: r.id, kind: 'risk', title: r.title, quotes: r.source_quotes })),
      ...a.processes.map((p) => ({ id: p.id, kind: 'process', title: p.name, quotes: p.source_quotes })),
    ];
    const hit = all.find((e) => e.id === entity_id);
    if (!hit) {
      return {
        content: [{ type: 'text', text: `Entity ${entity_id} not found in case ${case_id}` }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(hit, null, 2) }] };
  },
);

server.registerTool(
  'get_next_step_pack',
  {
    title: 'Get recommended next-step pack',
    description:
      'Zwraca rekomendowany pakiet plays (4-6 w 8-12 tygodni) wraz z rationale, scope, success metrics i prereqs.',
    inputSchema: {
      case_id: z
        .enum(AVAILABLE_CASES as [string, ...string[]])
        .default(DEFAULT_CASE),
    },
  },
  async ({ case_id }) => {
    const a = loadCase(case_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(a.next_step_pack, null, 2) }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // McpServer keeps the process alive via stdio
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
