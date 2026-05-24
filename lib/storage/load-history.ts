import fs from 'node:fs';
import path from 'node:path';
import { CompanyAnalysisSchema, type CompanyAnalysis } from '@/lib/schemas';

function historyDir(caseSlug: string): string {
  return path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/history');
}

export interface HistorySnapshot {
  takenAtIso: string; // parsed from filename
  analysis: CompanyAnalysis;
}

/**
 * Returns the most recent history snapshot for a case, or null if none exists.
 * Snapshots are written by mergeApprovedToAnalysis() in load-pending.ts.
 */
export function loadLatestSnapshot(caseSlug: string): HistorySnapshot | null {
  // Check in-memory history first (Vercel serverless fallback)
  try {
    // Lazy import to avoid circular dep
    const { getInMemoryHistory } = require('./load-pending') as {
      getInMemoryHistory: (slug: string) => { iso: string; analysis: CompanyAnalysis }[];
    };
    const mem = getInMemoryHistory(caseSlug);
    if (mem.length > 0) {
      const latest = mem[mem.length - 1];
      return { takenAtIso: latest.iso, analysis: latest.analysis };
    }
  } catch {
    // fall through
  }

  const dir = historyDir(caseSlug);
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  if (files.length === 0) return null;
  const latest = files[files.length - 1];
  const raw = JSON.parse(fs.readFileSync(path.join(dir, latest), 'utf8'));
  const analysis = CompanyAnalysisSchema.parse(raw);
  // filename was generated via toISOString().replace(/[:.]/g,'-') → revert
  const stem = latest.replace(/\.json$/, '');
  const iso = stem
    .replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3}Z)$/, '$1:$2:$3.$4');
  return { takenAtIso: iso, analysis };
}

export interface ScoreDelta {
  id: string;
  title: string;
  prev: number;
  curr: number;
  delta: number;
}

export function diffScores(
  prev: Map<string, number>,
  curr: Map<string, number>,
  titles: Map<string, string>,
  minDelta = 3,
): ScoreDelta[] {
  const out: ScoreDelta[] = [];
  for (const [id, currScore] of curr) {
    const prevScore = prev.get(id) ?? 0;
    const delta = currScore - prevScore;
    if (Math.abs(delta) >= minDelta || (prevScore === 0 && currScore >= minDelta)) {
      out.push({
        id,
        title: titles.get(id) ?? id,
        prev: prevScore,
        curr: currScore,
        delta,
      });
    }
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
