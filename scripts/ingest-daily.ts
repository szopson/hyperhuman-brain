/**
 * Phase A′ — Daily Ingestion
 *
 * Reads data/cases/{slug}/inputs/daily/{date}/{author}.md files, parses
 * frontmatter + body, and writes them as PendingEntity records to
 * data/cases/{slug}/outputs/pending-queue.json.
 *
 * Pending entities are NOT scored or surfaced in the brain until they are
 * approved via the review queue in the actions view.
 *
 * Usage:
 *   npx tsx scripts/ingest-daily.ts --case stock-hurt
 *   npx tsx scripts/ingest-daily.ts --case stock-hurt --since 2026-05-20
 */

import fs from 'node:fs';
import path from 'node:path';
import { PendingQueueSchema, CompanyAnalysisSchema, type PendingEntity } from '../lib/schemas';
import { extractDailyNote } from '../lib/extraction/extract-daily';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, rawV] = m;
    if (process.env[k]) continue;
    process.env[k] = rawV.replace(/^['"]|['"]$/g, '');
  }
}

interface CliArgs { caseSlug: string; since: string | null; llm: boolean }

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let caseSlug = 'stock-hurt';
  let since: string | null = null;
  let llm = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--case' && args[i + 1]) caseSlug = args[++i];
    if (args[i] === '--since' && args[i + 1]) since = args[++i];
    if (args[i] === '--llm') llm = true;
  }
  return { caseSlug, since, llm };
}

function loadKnownEntities(caseSlug: string) {
  const p = path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/analysis-full.json');
  if (!fs.existsSync(p)) return [];
  const a = CompanyAnalysisSchema.parse(JSON.parse(fs.readFileSync(p, 'utf8')));
  return [
    ...a.pains.map((x) => ({ id: x.id, title: x.title, kind: 'pain' })),
    ...a.risks.map((x) => ({ id: x.id, title: x.title, kind: 'risk' })),
    ...a.processes.map((x) => ({ id: x.id, title: x.name, kind: 'process' })),
    ...a.metrics.map((x) => ({ id: x.id, title: x.name, kind: 'metric' })),
  ];
}

interface Frontmatter {
  author_id: string;
  author_role: 'founder' | 'employee' | 'consultant';
  recorded_at: string;
  source_type: 'employee_voice_note' | 'employee_form' | 'chat_dump' | 'gdrive_doc';
  related_entities?: string[];
}

function parseFrontmatter(raw: string): { fm: Frontmatter; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Missing frontmatter');
  const [, fmRaw, body] = match;
  const fm: Record<string, unknown> = {};
  for (const line of fmRaw.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (value.startsWith('[') && value.endsWith(']')) {
      fm[key] = value.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      fm[key] = value.trim();
    }
  }
  return { fm: fm as unknown as Frontmatter, body: body.trim() };
}

function classify(body: string): PendingEntity['entity_type'] {
  const lower = body.toLowerCase();
  if (/ryzyk|threat|niebezpiecz|allegro zacz|regulamin/.test(lower)) return 'risk';
  if (/proces|process|sync|workflow/.test(lower)) return 'process_update';
  if (/wkurza|frustr|trac\w+ czas|kosztuje|ucieka|tracę/.test(lower)) return 'pain';
  if (/^\d+|wzros|metric|pp\b|%/.test(lower)) return 'metric';
  return 'observation';
}

function makePendingEntity(filePath: string, fm: Frontmatter, body: string, idx: number): PendingEntity {
  const id = `pending-${path.basename(path.dirname(filePath))}-${fm.author_id}-${idx}`;
  return {
    id,
    entity_type: classify(body),
    payload: {
      title: body.split('\n')[0].slice(0, 120),
      description: body,
    },
    raw_input: body,
    author_id: fm.author_id,
    author_role: fm.author_role,
    ingested_at: fm.recorded_at,
    source_type: fm.source_type,
    review: { status: 'pending', reviewed_by: null, reviewed_at: null, review_comment: null },
    related_entity_ids: fm.related_entities ?? [],
  };
}

function splitIntoChunks(body: string): string[] {
  // numbered items become separate pending entities; otherwise one entity per file
  const lines = body.split('\n');
  const itemStarts: number[] = [];
  lines.forEach((line, i) => {
    if (/^\d+\.\s/.test(line)) itemStarts.push(i);
  });
  if (itemStarts.length < 2) return [body];
  const chunks: string[] = [];
  for (let i = 0; i < itemStarts.length; i++) {
    const start = itemStarts[i];
    const end = itemStarts[i + 1] ?? lines.length;
    chunks.push(lines.slice(start, end).join('\n').replace(/^\d+\.\s*/, '').trim());
  }
  return chunks;
}

async function main() {
  loadEnvLocal();
  const { caseSlug, since, llm } = parseArgs();
  const root = path.join(process.cwd(), 'data/cases', caseSlug, 'inputs/daily');
  if (!fs.existsSync(root)) {
    console.error(`No daily inputs at ${root}`);
    process.exit(0);
  }

  const knownEntities = llm ? loadKnownEntities(caseSlug) : [];
  console.log(
    llm
      ? `LLM mode: ${knownEntities.length} known entities for matching`
      : 'Heuristic mode (use --llm for Claude-driven extraction)',
  );

  const entities: PendingEntity[] = [];
  const dateDirs = fs.readdirSync(root).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  for (const dateDir of dateDirs) {
    if (since && dateDir < since) continue;
    const dir = path.join(root, dateDir);
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { fm, body } = parseFrontmatter(raw);

      if (llm) {
        process.stderr.write(`extracting ${dateDir}/${file}…`);
        const llmEntities = await extractDailyNote({
          rawNote: body,
          authorId: fm.author_id,
          authorRole: fm.author_role,
          recordedAt: fm.recorded_at,
          sourceType: fm.source_type,
          knownEntities,
        });
        process.stderr.write(` → ${llmEntities.length} entries\n`);
        entities.push(...llmEntities);
      } else {
        const chunks = splitIntoChunks(body);
        chunks.forEach((chunk, idx) => {
          entities.push(makePendingEntity(path.join(dir, file), fm, chunk, idx));
        });
      }
    }
  }

  const queue = {
    case_id: caseSlug,
    generated_at: new Date().toISOString(),
    entities,
  };
  PendingQueueSchema.parse(queue);

  const outPath = path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/pending-queue.json');
  fs.writeFileSync(outPath, JSON.stringify(queue, null, 2));
  console.log(`Wrote ${entities.length} pending entities to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
