/**
 * Clean company.name — remove "(Estilo / Stocario robocza)" which was a
 * hallucination by Phase A LLM. Verified zero occurrences of those strings
 * in the source transcript.
 */
import fs from 'node:fs';
import { CompanyAnalysisSchema } from '@/lib/schemas';

const PATH = 'data/cases/stock-hurt/outputs/analysis-raw.json';

const raw = JSON.parse(fs.readFileSync(PATH, 'utf8'));

const before = raw.company.name;
raw.company.name = 'Stockhurt';

const r = CompanyAnalysisSchema.safeParse(raw);
if (!r.success) {
  console.error('Schema validation failed:');
  console.error(JSON.stringify(r.error.issues.slice(0, 10), null, 2));
  process.exit(1);
}

fs.writeFileSync(PATH, JSON.stringify(r.data, null, 2));
console.log(`✓ company.name: ${JSON.stringify(before)} → "Stockhurt"`);
