import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { CompanyAnalysisSchema, type CompanyAnalysis } from '@/lib/schemas';
import { MASTER_EXTRACTION_PROMPT } from './master-prompt';

const MODEL = 'claude-opus-4-7';

const PHASE_A_ADDENDUM = `

PHASE-A SCOPE NOTE:
This is the initial extraction (Phase A). You are NOT computing scoring or recommendations yet. For the required schema fields that belong to downstream layers, output the following placeholders so the output validates:
- play_matches: []
- ranked_opportunities: []
- action_points: []
- next_step_pack: { id: "placeholder", title: "TBD — Phase A only", one_liner: "Pending scoring", selected_plays: [], framing: "pilot", rationale: "Pending downstream scoring pass.", scope: { in_scope: [], out_of_scope: [] }, timeline_weeks: 0, pricing: null, deliverables: [], success_metrics: [], team_required: [], client_commitment: [], risks_and_assumptions: [], next_logical_step_after: "Run scoring + plays matching pass." }
- last_continuous_refresh: null
- ingestion_sources_active: []
Fill metadata.case_id with "stock-hurt", metadata.generated_at with current ISO timestamp, metadata.pipeline_version with "0.1-phase-a".`;

export interface ExtractOptions {
  caseId?: string;
  outputPath?: string;
  apiKey?: string;
}

export async function extractFromTranscript(
  transcriptText: string,
  options: ExtractOptions = {},
): Promise<CompanyAnalysis> {
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY (set in .env.local)');

  const client = new Anthropic({ apiKey });

  const jsonSchema = z.toJSONSchema(CompanyAnalysisSchema, {
    target: 'draft-7',
    reused: 'inline',
  }) as Record<string, unknown>;
  delete jsonSchema['$schema'];

  const toolName = 'extract_company_analysis';

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: MASTER_EXTRACTION_PROMPT + PHASE_A_ADDENDUM,
    tools: [
      {
        name: toolName,
        description:
          'Emit the full CompanyAnalysis structured object extracted from the transcript.',
        input_schema: jsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: toolName },
    messages: [
      {
        role: 'user',
        content: `TRANSCRIPT (Polish, raw):\n\n${transcriptText}`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error(
      `Model did not return tool_use. stop_reason=${response.stop_reason}, content=${JSON.stringify(response.content).slice(0, 500)}`,
    );
  }

  const parsed = CompanyAnalysisSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    const errPath = options.outputPath
      ? options.outputPath.replace(/\.json$/, '.invalid.json')
      : null;
    if (errPath) {
      fs.mkdirSync(path.dirname(errPath), { recursive: true });
      fs.writeFileSync(errPath, JSON.stringify(toolUse.input, null, 2));
    }
    throw new Error(
      `CompanyAnalysisSchema validation failed.\n${z.prettifyError(parsed.error)}\nRaw saved: ${errPath ?? '(not saved)'}`,
    );
  }

  if (options.outputPath) {
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
    fs.writeFileSync(options.outputPath, JSON.stringify(parsed.data, null, 2));
  }

  return parsed.data;
}
