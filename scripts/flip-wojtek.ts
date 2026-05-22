/**
 * v3 correction: Wojtek is HyperHuman tech consultant, not Stock-Hurt IT.
 * Earlier evidence (parsing Stock-Hurt WhatsApp, 3-month ML attempt on 400k SKU)
 * fits HH-side too: HH got data dumps from Stock-Hurt for analysis, Wojtek
 * (HH IT) parsed them and attempted ML pricing as part of HH's prior engagement.
 *
 * Updates analysis-raw.json stakeholders array.
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
}

const wojtek = raw.stakeholders.find((s: Stakeholder) => s.id === 'stk-wojtek');
if (!wojtek) {
  console.error('Could not find Wojtek in stakeholders.');
  process.exit(1);
}

wojtek.role = 'HyperHuman consultant (tech)';
wojtek.is_decision_maker = false;

const r = CompanyAnalysisSchema.safeParse(raw);
if (!r.success) {
  console.error('Schema validation failed after flip:');
  console.error(JSON.stringify(r.error.issues.slice(0, 10), null, 2));
  process.exit(1);
}

fs.writeFileSync(PATH, JSON.stringify(r.data, null, 2));
console.log('✓ Flipped Wojtek → HyperHuman consultant (tech)');
console.log('\nFinal stakeholders:');
r.data.stakeholders.forEach((s) => {
  console.log(
    `  ${s.name} — ${s.role} (decision_maker=${s.is_decision_maker})`,
  );
});
