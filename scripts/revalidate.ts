import fs from 'node:fs';
import { CompanyAnalysisSchema } from '@/lib/schemas';
import { z } from 'zod';

const raw = JSON.parse(
  fs.readFileSync(
    'data/cases/stock-hurt/outputs/analysis-raw.invalid.json',
    'utf8',
  ),
);
const inner = raw.company_analysis ?? raw;
const r = CompanyAnalysisSchema.safeParse(inner);
if (r.success) {
  fs.writeFileSync(
    'data/cases/stock-hurt/outputs/analysis-raw.json',
    JSON.stringify(r.data, null, 2),
  );
  console.log('✅ valid');
  console.log('  processes:', r.data.processes.length);
  console.log('  pains:', r.data.pains.length);
  console.log('  risks:', r.data.risks.length);
  console.log('  stakeholders:', r.data.stakeholders.length);
  console.log('  competitors:', r.data.competitors.length);
  console.log('  metrics:', r.data.metrics.length);
  console.log('  tools:', r.data.tools.length);
  console.log('  market_signals:', r.data.market_signals.length);
  console.log('  action_points:', r.data.action_points.length);
  console.log('  overall_confidence:', r.data.overall_confidence);
} else {
  console.log('❌ invalid');
  console.log(z.prettifyError(r.error).slice(0, 5000));
}
