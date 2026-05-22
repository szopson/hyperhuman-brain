/**
 * One-shot fix: Maciej is HyperHuman consultant (strategy/business),
 * Kuba is Stock-Hurt co-founder. Earlier Phase A extraction had these
 * swapped — corrected after careful re-read of L1685-1693 + L347.
 *
 * Updates analysis-raw.json stakeholders array. Does NOT touch transcript
 * (we still use the original).
 */
import fs from 'node:fs';
import { CompanyAnalysisSchema } from '@/lib/schemas';

const PATH = 'data/cases/stock-hurt/outputs/analysis-raw.json';

const raw = JSON.parse(fs.readFileSync(PATH, 'utf8'));

interface Stakeholder {
  id: string;
  name: string | null;
  role: string;
  is_decision_maker: boolean;
  primary_concerns: string[];
  emotional_signal: string | null;
  source_quotes: unknown[];
}

const maciej = raw.stakeholders.find((s: Stakeholder) => s.id === 'stk-maciej');
const kuba = raw.stakeholders.find((s: Stakeholder) => s.id === 'stk-kuba');

if (!maciej || !kuba) {
  console.error('Could not find Maciej and Kuba in stakeholders.');
  process.exit(1);
}

maciej.role = 'HyperHuman consultant (strategy / business)';
maciej.is_decision_maker = false;

kuba.role = 'Co-founder';
kuba.is_decision_maker = true;

const r = CompanyAnalysisSchema.safeParse(raw);
if (!r.success) {
  console.error('Schema validation failed after flip:');
  console.error(JSON.stringify(r.error.issues.slice(0, 10), null, 2));
  process.exit(1);
}

fs.writeFileSync(PATH, JSON.stringify(r.data, null, 2));
console.log('✓ Flipped Maciej → HyperHuman consultant, Kuba → Co-founder');
console.log('\nFinal stakeholders:');
r.data.stakeholders.forEach((s) => {
  console.log(`  ${s.name} — ${s.role} (decision_maker=${s.is_decision_maker})`);
});
