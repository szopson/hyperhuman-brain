import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { PendingEntity } from '@/lib/schemas';

const MODEL = 'claude-opus-4-7';

// Compact schema for what the LLM should emit per daily note.
const DailyExtractionSchema = z.object({
  entries: z
    .array(
      z.object({
        entity_type: z.enum(['pain', 'risk', 'process_update', 'metric', 'observation']),
        title: z.string().max(140).describe('Krótkie streszczenie obserwacji'),
        description: z.string().describe('2-4 zdania kontekstu'),
        source_quote: z.string().describe('Dosłowny cytat z notatki, max 200 znaków'),
        confidence: z.enum(['high', 'medium', 'low']),
        related_entity_ids: z
          .array(z.string())
          .describe('IDs pains/risks/processes/metrics z analysis-full.json które ta obserwacja wzmacnia lub modyfikuje'),
      }),
    )
    .describe('Jedna lub więcej obserwacji wyciągniętych z notatki. Jeśli notatka wzmiankuje wiele rzeczy — rozdziel je.'),
});

const SYSTEM_PROMPT = `Jesteś ekstraktorem encji dla mózgu firmy. Dostajesz krótką notatkę (głosówkę / formularz) od pracownika lub foundera i listę istniejących encji (pains/risks/processes/metrics).

Twoje zadanie:
1. Rozdziel notatkę na osobne entries — jeden entry = jedna dystynktywna obserwacja, decyzja, problem, lub aktualizacja.
2. Dla każdego entry sklasyfikuj entity_type: pain (frustracja, problem, traci), risk (zewnętrzne zagrożenie, regulacja, konkurent), process_update (zmiana w sposobie pracy), metric (liczba, %, kwota), observation (neutralna informacja).
3. WYMAGANY dosłowny cytat (source_quote) z oryginalnej notatki — to jest twarda zasada anty-halucynacyjna. Nie parafrazuj.
4. related_entity_ids — dopasuj do istniejących encji jeśli notatka wzmiankuje konkretny pain/risk/process. Pusty array OK jeśli nie ma dopasowania.
5. confidence: high jeśli notatka konkretnie nazywa rzecz, medium jeśli interpretacja, low jeśli niejasne.

NIE wymyślaj liczb, dat, nazw, ani osób spoza notatki. NIE rozszerzaj scope poza to co napisał autor.`;

interface ExtractDailyOptions {
  rawNote: string;
  authorId: string;
  authorRole: 'founder' | 'employee' | 'consultant';
  recordedAt: string;
  sourceType: PendingEntity['source_type'];
  knownEntities: { id: string; title: string; kind: string }[];
  apiKey?: string;
}

export async function extractDailyNote(opts: ExtractDailyOptions): Promise<PendingEntity[]> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY (set in .env.local)');

  const client = new Anthropic({ apiKey });
  const jsonSchema = z.toJSONSchema(DailyExtractionSchema, {
    target: 'draft-2020-12',
    reused: 'inline',
  }) as Record<string, unknown>;
  delete jsonSchema['$schema'];

  const knownList = opts.knownEntities
    .map((e) => `- ${e.id} (${e.kind}): ${e.title}`)
    .join('\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: 'emit_daily_entries',
        description: 'Emit structured entries extracted from the daily note.',
        input_schema: jsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: 'emit_daily_entries' },
    messages: [
      {
        role: 'user',
        content: `=== ISTNIEJĄCE ENCJE W MÓZGU ===\n${knownList || '(brak)'}\n\n=== NOTATKA (${opts.authorRole}: ${opts.authorId}, ${opts.recordedAt}) ===\n\n${opts.rawNote}`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error(`Model did not return tool_use. stop_reason=${response.stop_reason}`);
  }
  const parsed = DailyExtractionSchema.parse(toolUse.input);

  return parsed.entries.map((entry, idx) => ({
    id: `pending-${opts.recordedAt.slice(0, 10)}-${opts.authorId}-llm-${idx}`,
    entity_type: entry.entity_type,
    payload: {
      title: entry.title,
      description: entry.description,
      source_quote: entry.source_quote,
      confidence: entry.confidence,
      llm_extracted: true,
    },
    raw_input: opts.rawNote,
    author_id: opts.authorId,
    author_role: opts.authorRole,
    ingested_at: opts.recordedAt,
    source_type: opts.sourceType,
    review: { status: 'pending' as const, reviewed_by: null, reviewed_at: null, review_comment: null },
    related_entity_ids: entry.related_entity_ids,
  }));
}
