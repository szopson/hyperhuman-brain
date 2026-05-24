/**
 * Weekly Founder Briefing generator.
 *
 * Composes a deterministic markdown digest from the current brain state:
 *   - new pending entities since --since
 *   - top 5 pains (by problem_score) + recent changes
 *   - imminent risks
 *   - next-step pack progress (placeholder until P-020 wires up)
 *   - top 3 decisions for the founder this week
 *
 * Dogfood: this is exactly play P-020 from our own plays library.
 *
 * Usage:
 *   npx tsx scripts/generate-briefing.ts --case stock-hurt --since 2026-05-16
 *   npx tsx scripts/generate-briefing.ts --case stock-hurt   # since 7 days ago
 */

import fs from 'node:fs';
import path from 'node:path';
import { CompanyAnalysisSchema, PendingQueueSchema, type CompanyAnalysis, type PendingEntity } from '../lib/schemas';
import { computeAllScores } from '../lib/scoring';
import { loadLatestSnapshot, diffScores } from '../lib/storage/load-history';

interface Args { caseSlug: string; since: Date }

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let caseSlug = 'stock-hurt';
  let sinceArg: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--case' && args[i + 1]) caseSlug = args[++i];
    if (args[i] === '--since' && args[i + 1]) sinceArg = args[++i];
  }
  const since = sinceArg
    ? new Date(sinceArg)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return { caseSlug, since };
}

function loadAnalysis(caseSlug: string): CompanyAnalysis {
  const p = path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/analysis-full.json');
  return CompanyAnalysisSchema.parse(JSON.parse(fs.readFileSync(p, 'utf8')));
}

function loadPending(caseSlug: string): PendingEntity[] {
  const p = path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/pending-queue.json');
  if (!fs.existsSync(p)) return [];
  return PendingQueueSchema.parse(JSON.parse(fs.readFileSync(p, 'utf8'))).entities;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function main() {
  const { caseSlug, since } = parseArgs();
  const a = loadAnalysis(caseSlug);
  const pending = loadPending(caseSlug);
  const { problem_scores, risk_scores } = computeAllScores(a);

  const newPending = pending.filter((e) => new Date(e.ingested_at) >= since);
  const awaitingReview = pending.filter((e) => e.review.status === 'pending');
  const approvedThisWeek = pending.filter(
    (e) => e.review.status === 'approved' && e.review.reviewed_at && new Date(e.review.reviewed_at) >= since,
  );

  const topPains = a.pains
    .map((p) => ({ p, s: problem_scores.get(p.id)?.final_score_0_100 ?? 0 }))
    .sort((x, y) => y.s - x.s)
    .slice(0, 5);

  const imminentRisks = a.risks
    .filter((r) => r.time_horizon === 'imminent_3_months')
    .map((r) => ({ r, s: risk_scores.get(r.id)?.severity_score_0_100 ?? 0 }))
    .sort((x, y) => y.s - x.s);

  const lines: string[] = [];
  lines.push(`# Founder Briefing — ${a.company.anonymized_name}`);
  lines.push(`*Tydzień od ${fmtDate(since.toISOString())} do ${fmtDate(new Date().toISOString())}*`);
  lines.push('');
  lines.push('## TL;DR');
  lines.push(`- ${newPending.length} nowych wpisów z daily ingestion · ${awaitingReview.length} czeka na review`);
  lines.push(`- ${approvedThisWeek.length} encji zaakceptowanych w tym tygodniu (wpadły do scoring)`);
  lines.push(`- Top problem: **${topPains[0]?.p.title}** (score ${topPains[0]?.s.toFixed(0)}/100)`);
  lines.push(`- Najpilniejsze ryzyko: **${imminentRisks[0]?.r.title ?? 'brak imminent'}**`);
  lines.push('');

  lines.push('## Nowe sygnały z zespołu (Phase A′)');
  if (newPending.length === 0) {
    lines.push('*Brak nowych wpisów w tym oknie czasowym.*');
  } else {
    for (const e of newPending) {
      const payload = e.payload as { title?: string };
      lines.push(`- **[${e.review.status}]** ${payload.title} — *${e.author_id} (${e.author_role}), ${fmtDate(e.ingested_at)}*`);
    }
  }
  lines.push('');

  lines.push('## Top 5 painów — gdzie najmocniej boli');
  for (const { p, s } of topPains) {
    lines.push(`1. **${p.title}** — score ${s.toFixed(0)}/100`);
    lines.push(`   - kategoria: ${p.category} · emocja: ${p.founder_emotional_intensity} · severity: ${p.severity}`);
    if (p.founder_quoted_phrase) {
      lines.push(`   - cytat: *"${p.founder_quoted_phrase}"*`);
    }
  }
  lines.push('');

  lines.push('## Score deltas vs ostatni snapshot');
  const prevSnap = loadLatestSnapshot(caseSlug);
  if (!prevSnap) {
    lines.push('*Brak poprzedniego snapshotu — pierwsze uruchomienie po merge.*');
  } else {
    const prevScores = computeAllScores(prevSnap.analysis);
    const prevPainMap = new Map(
      [...prevScores.problem_scores].map(([id, b]) => [id, b.final_score_0_100]),
    );
    const currPainMap = new Map(
      [...problem_scores].map(([id, b]) => [id, b.final_score_0_100]),
    );
    const painTitles = new Map(a.pains.map((p) => [p.id, p.title]));
    const painDeltas = diffScores(prevPainMap, currPainMap, painTitles, 3);

    const prevRiskMap = new Map(
      [...prevScores.risk_scores].map(([id, b]) => [id, b.severity_score_0_100]),
    );
    const currRiskMap = new Map(
      [...risk_scores].map(([id, b]) => [id, b.severity_score_0_100]),
    );
    const riskTitles = new Map(a.risks.map((r) => [r.id, r.title]));
    const riskDeltas = diffScores(prevRiskMap, currRiskMap, riskTitles, 3);

    if (painDeltas.length === 0 && riskDeltas.length === 0) {
      lines.push(`*Bez istotnych zmian (≥3pkt) vs snapshot z ${fmtDate(prevSnap.takenAtIso)}.*`);
    } else {
      lines.push(`*Vs snapshot z ${fmtDate(prevSnap.takenAtIso)} (Δ ≥ 3pkt):*`);
      for (const d of painDeltas.slice(0, 5)) {
        const arrow = d.delta > 0 ? '↑' : '↓';
        const sign = d.delta > 0 ? '+' : '';
        lines.push(`- ${arrow} **${d.title}** — ${d.prev.toFixed(0)} → ${d.curr.toFixed(0)} (${sign}${d.delta.toFixed(0)})`);
      }
      for (const d of riskDeltas.slice(0, 3)) {
        const arrow = d.delta > 0 ? '↑' : '↓';
        const sign = d.delta > 0 ? '+' : '';
        lines.push(`- ${arrow} *risk* **${d.title}** — ${d.prev.toFixed(0)} → ${d.curr.toFixed(0)} (${sign}${d.delta.toFixed(0)})`);
      }
    }
  }
  lines.push('');

  lines.push('## Imminent risks (≤3m)');
  if (imminentRisks.length === 0) {
    lines.push('*Brak imminent risks.*');
  } else {
    for (const { r, s } of imminentRisks) {
      lines.push(`- **${r.title}** — severity ${s.toFixed(0)}/100, mitigation: ${r.mitigation_status}`);
    }
  }
  lines.push('');

  lines.push('## Next Step Pack — status');
  const pack = a.next_step_pack;
  lines.push(`Pakiet: **${pack.title}** (${pack.timeline_weeks} tyg, plays: ${pack.selected_plays.join(', ')})`);
  lines.push(`Framing: ${pack.framing}`);
  lines.push(`Następny logiczny krok po: ${pack.next_logical_step_after}`);
  lines.push('');

  lines.push('## 3 decyzje na ten tydzień');
  const decisions: string[] = [];
  if (awaitingReview.length > 0) {
    decisions.push(`Przejrzeć **${awaitingReview.length} pending entities** w review queue — bez tego scoring nie ruszy się z miejsca.`);
  }
  if (topPains[0]) {
    decisions.push(`Zaadresować pain **${topPains[0].p.title}** — score ${topPains[0].s.toFixed(0)}/100 jest top of mind founderów.`);
  }
  if (imminentRisks[0] && imminentRisks[0].r.mitigation_status === 'none') {
    decisions.push(`Zaplanować mitigation dla ryzyka **${imminentRisks[0].r.title}** — obecnie brak planu.`);
  }
  if (decisions.length === 0) decisions.push('Brak high-priority decyzji w tym oknie. Skupić się na plays z Next Step Pack.');
  decisions.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
  lines.push('');

  lines.push('---');
  lines.push(`*Wygenerowane deterministycznie z analysis-full.json + pending-queue.json. Pipeline: ${a.metadata.pipeline_version}.*`);

  const outDir = path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/briefings');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = path.join(outDir, `briefing-${stamp}.md`);
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`Wrote briefing to ${outPath}`);
  console.log('---');
  console.log(lines.join('\n'));
}

main();
