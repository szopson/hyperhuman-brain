import Link from 'next/link';
import { loadPendingQueue } from '@/lib/storage/load-pending';
import { currentCaseSlug, loadAnalysis } from '@/lib/storage/load-analysis';
import { loadLatestSnapshot } from '@/lib/storage/load-history';
import { computeAllScores } from '@/lib/scoring';

function fmtAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'przed chwilą';
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'przed chwilą';
  if (min < 60) return `${min} min temu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h temu`;
  const d = Math.floor(h / 24);
  return `${d}d temu`;
}

export async function LiveBrainTicker({
  lastRefreshIso,
}: {
  lastRefreshIso: string | null;
}) {
  const caseSlug = await currentCaseSlug();
  const queue = loadPendingQueue(caseSlug);
  const pendingCount = queue.entities.filter((e) => e.review.status === 'pending').length;
  const approvedThisWeek = queue.entities.filter((e) => {
    if (e.review.status !== 'approved' || !e.review.reviewed_at) return false;
    return Date.now() - new Date(e.review.reviewed_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const latestIngest = queue.entities
    .map((e) => new Date(e.ingested_at).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];

  // Top-pain delta vs latest snapshot
  let topPainDelta: { title: string; delta: number; curr: number } | null = null;
  const snap = loadLatestSnapshot(caseSlug);
  if (snap) {
    const a = await loadAnalysis();
    const currScores = computeAllScores(a);
    const prevScores = computeAllScores(snap.analysis);
    let best: { id: string; delta: number; curr: number } | null = null;
    for (const [id, b] of currScores.problem_scores) {
      const prev = prevScores.problem_scores.get(id)?.final_score_0_100 ?? 0;
      const d = b.final_score_0_100 - prev;
      if (Math.abs(d) >= 3 && (!best || Math.abs(d) > Math.abs(best.delta))) {
        best = { id, delta: d, curr: b.final_score_0_100 };
      }
    }
    if (best) {
      const pain = a.pains.find((p) => p.id === best!.id);
      if (pain) topPainDelta = { title: pain.title, delta: best.delta, curr: best.curr };
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-emerald-900/40 bg-emerald-950/10 px-3 py-2 font-mono text-[11px]">
      <span className="flex items-center gap-2 font-medium text-emerald-200">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </span>
        brain live
      </span>
      {lastRefreshIso && (
        <span className="text-zinc-500">
          ostatnie scoring: <span className="text-zinc-300">{fmtAgo(lastRefreshIso)}</span>
        </span>
      )}
      {latestIngest && (
        <span className="text-zinc-500">
          ostatni daily ingest: <span className="text-zinc-300">{fmtAgo(new Date(latestIngest).toISOString())}</span>
        </span>
      )}
      {pendingCount > 0 && (
        <Link
          href="/review"
          className="text-amber-300 underline-offset-4 hover:underline"
        >
          {pendingCount} pending → review
        </Link>
      )}
      {pendingCount === 0 && (
        <span className="text-zinc-500">
          pending: <span className="text-zinc-300">0</span>
        </span>
      )}
      {approvedThisWeek > 0 && (
        <span className="text-zinc-500">
          7d approved: <span className="text-zinc-300">{approvedThisWeek}</span>
        </span>
      )}
      {topPainDelta && (
        <span className={topPainDelta.delta > 0 ? 'text-rose-300' : 'text-emerald-300'}>
          {topPainDelta.delta > 0 ? '↑' : '↓'} {topPainDelta.title.slice(0, 40)}
          {topPainDelta.title.length > 40 ? '…' : ''} ({topPainDelta.delta > 0 ? '+' : ''}
          {topPainDelta.delta.toFixed(0)})
        </span>
      )}
    </div>
  );
}
