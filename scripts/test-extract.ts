import fs from 'node:fs';
import path from 'node:path';
import { extractFromTranscript } from '@/lib/extraction/extract';

async function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, rawV] = m;
    if (process.env[k]) continue;
    const v = rawV.replace(/^['"]|['"]$/g, '');
    process.env[k] = v;
  }
}

async function main() {
  await loadEnvLocal();

  const caseId = 'stock-hurt';
  const root = process.cwd();
  const inputPath = path.join(root, 'data/cases', caseId, 'inputs/conversation-transcript.txt');
  const outputPath = path.join(root, 'data/cases', caseId, 'outputs/analysis-raw.json');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Transcript not found: ${inputPath}`);
  }

  const transcript = fs.readFileSync(inputPath, 'utf8');
  console.log(`Loaded transcript: ${transcript.length.toLocaleString()} chars`);
  console.log(`Sending to Claude (model: claude-opus-4-7)...`);

  const t0 = Date.now();
  const analysis = await extractFromTranscript(transcript, {
    caseId,
    outputPath,
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\nDone in ${dt}s. Wrote: ${outputPath}`);
  console.log(`Summary:`);
  console.log(`  company:       ${analysis.company.name}`);
  console.log(`  processes:     ${analysis.processes.length}`);
  console.log(`  pains:         ${analysis.pains.length}`);
  console.log(`  risks:         ${analysis.risks.length}`);
  console.log(`  metrics:       ${analysis.metrics.length}`);
  console.log(`  tools:         ${analysis.tools.length}`);
  console.log(`  stakeholders:  ${analysis.stakeholders.length}`);
  console.log(`  competitors:   ${analysis.competitors.length}`);
  console.log(`  followups:     ${analysis.followup_questions.length}`);
  console.log(`  confidence:    ${analysis.overall_confidence}`);
}

main().catch((err) => {
  console.error('\n❌ Extraction failed:\n', err);
  process.exit(1);
});
