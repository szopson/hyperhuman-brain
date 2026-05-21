import fs from 'node:fs';
import path from 'node:path';
import { CompanyAnalysisSchema, PainSchema, type CompanyAnalysis, type Pain } from '@/lib/schemas';
import { computeAllScores } from '@/lib/scoring';
import { PLAYS } from '@/lib/plays/library';
import { computePlayMatches, selectNextStepPlays } from '@/lib/plays/matching';

const INPUT = 'data/cases/stock-hurt/outputs/analysis-raw.json';
const OVERLAY = 'data/cases/stock-hurt/inputs/strategic-briefing-overlay.json';
const OUTPUT = 'data/cases/stock-hurt/outputs/analysis-full.json';
const BUDGET_WEEKS = 12;

function loadRaw(): CompanyAnalysis {
  const raw = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  const parsed = CompanyAnalysisSchema.parse(raw);
  return parsed;
}

function mergeOverlay(analysis: CompanyAnalysis): CompanyAnalysis {
  if (!fs.existsSync(OVERLAY)) {
    console.log('[overlay] No strategic briefing overlay found — skipping');
    return analysis;
  }
  const overlay = JSON.parse(fs.readFileSync(OVERLAY, 'utf8'));
  const addedPains: Pain[] = (overlay.additional_pains ?? []).map((p: unknown) =>
    PainSchema.parse(p),
  );
  const existingIds = new Set(analysis.pains.map((p) => p.id));
  const newPains = addedPains.filter((p) => !existingIds.has(p.id));
  if (newPains.length === 0) {
    console.log('[overlay] No new pains to merge (all IDs already present)');
    return analysis;
  }
  console.log(
    `[overlay] Merged ${newPains.length} additional pains from strategic briefing: ${newPains.map((p) => p.id).join(', ')}`,
  );
  return { ...analysis, pains: [...analysis.pains, ...newPains] };
}

function fmtTable(rows: Array<Record<string, string | number>>): string {
  if (rows.length === 0) return '(empty)';
  const cols = Object.keys(rows[0]);
  const widths: Record<string, number> = {};
  for (const c of cols) {
    widths[c] = Math.max(
      c.length,
      ...rows.map((r) => String(r[c]).length),
    );
  }
  const header = cols.map((c) => c.padEnd(widths[c])).join('  ');
  const sep = cols.map((c) => '─'.repeat(widths[c])).join('  ');
  const body = rows
    .map((r) => cols.map((c) => String(r[c]).padEnd(widths[c])).join('  '))
    .join('\n');
  return [header, sep, body].join('\n');
}

function main() {
  console.log('Loading analysis-raw.json...');
  const raw = loadRaw();
  console.log(
    `  pains=${raw.pains.length}, risks=${raw.risks.length}, processes=${raw.processes.length}, tools=${raw.tools.length}, metrics=${raw.metrics.length}`,
  );

  const analysis = mergeOverlay(raw);
  if (analysis !== raw) {
    console.log(`  pains after overlay: ${analysis.pains.length}`);
  }

  console.log('\nComputing scores (problem / leakage / risk)...');
  const scores = computeAllScores(analysis);
  console.log(
    `  problem_scores=${scores.problem_scores.size}, leakage_scores=${scores.leakage_scores.size}, risk_scores=${scores.risk_scores.size}`,
  );

  console.log('\nMatching plays to pains + computing PlayMatches...');
  const playMatches = computePlayMatches({
    analysis,
    plays: PLAYS,
    problem_scores: scores.problem_scores,
    leakage_scores: scores.leakage_scores,
  });
  console.log(`  play_matches=${playMatches.length}/${PLAYS.length}`);

  console.log('\nSelecting Next Step Pack (constraint satisfaction)...');
  const pack = selectNextStepPlays({
    matches: playMatches,
    plays: PLAYS,
    pains: analysis.pains,
    risks: analysis.risks,
    timelineBudgetWeeks: BUDGET_WEEKS,
  });
  console.log(
    `  selected ${pack.selected_plays.length} plays, total ${pack.timeline_weeks}w`,
  );

  const full: CompanyAnalysis = {
    ...analysis,
    play_matches: playMatches,
    ranked_opportunities: playMatches.slice(0, 10).map((m) => m.play_id),
    next_step_pack: pack,
  };

  // Validate output
  const reparsed = CompanyAnalysisSchema.safeParse(full);
  if (!reparsed.success) {
    console.error('❌ Final analysis fails schema validation:');
    console.error(JSON.stringify(reparsed.error.issues.slice(0, 10), null, 2));
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(reparsed.data, null, 2));
  console.log(`\n✅ Wrote ${OUTPUT}`);

  // ============ SANITY REPORT ============
  console.log('\n══════ SANITY REPORT ══════');

  // Top 5 pains by Problem Score
  console.log('\n■ Top 5 pains by Problem Score');
  const painRows = analysis.pains
    .map((p) => ({
      id: p.id,
      score: scores.problem_scores.get(p.id)?.final_score_0_100 ?? 0,
      cat: p.category,
      sev: p.severity,
      emo: p.founder_emotional_intensity,
      title: p.title.slice(0, 60),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  console.log(fmtTable(painRows));

  // Top 5 risks
  console.log('\n■ Top 5 risks by Severity');
  const riskRows = analysis.risks
    .map((r) => ({
      id: r.id,
      score: scores.risk_scores.get(r.id)?.severity_score_0_100 ?? 0,
      prob: r.probability,
      impact: r.impact,
      horizon: r.time_horizon,
      title: r.title.slice(0, 50),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  console.log(fmtTable(riskRows));

  // Top 10 plays by composite
  console.log('\n■ Top 10 plays by composite score');
  const playRows = playMatches.slice(0, 10).map((m) => ({
    play: m.play_id,
    composite: m.composite_score,
    bi: m.business_impact_score.toFixed(1),
    cavac: m.cavac_readiness.composite.toFixed(1),
    weeks: m.estimated_effort_weeks,
    pln_mo: m.estimated_impact_pln_monthly ?? '—',
    pains: m.matched_pains.length,
  }));
  console.log(fmtTable(playRows));

  // Next Step Pack
  console.log('\n■ Next Step Pack');
  console.log(`  title: ${pack.title}`);
  console.log(`  one_liner: ${pack.one_liner}`);
  console.log(`  total_weeks: ${pack.timeline_weeks}`);
  console.log(`  selected_plays (${pack.selected_plays.length}):`);
  for (const pid of pack.selected_plays) {
    const m = playMatches.find((mm) => mm.play_id === pid);
    console.log(
      `    - ${pid} (composite=${m?.composite_score ?? '?'}, ${m?.estimated_effort_weeks ?? '?'}w)`,
    );
  }

  // Red flags
  console.log('\n■ Red flag scan');
  const flags: string[] = [];
  const scoresArr = playMatches.map((m) => m.composite_score);
  const allZero = scoresArr.every((s) => s === 0);
  const allMax = scoresArr.every((s) => s >= 95);
  const hasNaN = scoresArr.some((s) => Number.isNaN(s));
  if (allZero) flags.push('ALL composite scores = 0');
  if (allMax) flags.push('ALL composite scores ≥ 95 (saturation)');
  if (hasNaN) flags.push('NaN detected in composite scores');

  // CAVAC distinguishing
  const cavacComposites = playMatches.map((m) => m.cavac_readiness.composite);
  const cavacMin = Math.min(...cavacComposites);
  const cavacMax = Math.max(...cavacComposites);
  const cavacSpread = cavacMax - cavacMin;
  console.log(
    `  CAVAC composite: min=${cavacMin.toFixed(2)}, max=${cavacMax.toFixed(2)}, spread=${cavacSpread.toFixed(2)}`,
  );
  if (cavacSpread < 0.5) flags.push('CAVAC readiness not distinguishing plays (spread < 0.5)');

  // Problem score spread
  const probScores = [...scores.problem_scores.values()].map(
    (s) => s.final_score_0_100,
  );
  if (probScores.length > 0) {
    const pMin = Math.min(...probScores);
    const pMax = Math.max(...probScores);
    console.log(`  Problem score range: ${pMin}–${pMax}`);
    if (pMax - pMin < 10) flags.push('Problem scores have low spread');
  }

  if (flags.length === 0) {
    console.log('  ✅ no red flags');
  } else {
    console.log('  ⚠️ flags:');
    flags.forEach((f) => console.log(`    - ${f}`));
  }
}

main();
