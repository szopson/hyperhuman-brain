import { loadAnalysis } from '@/lib/storage/load-analysis';

interface ContextChunk {
  id: string;
  kind: 'pain' | 'risk' | 'process' | 'play' | 'metric';
  title: string;
  body: string;
  quotes: { text: string; speaker: string | null; confidence: string }[];
}

/**
 * Builds a compact RAG context from analysis-full.json — pains, risks, top plays,
 * each with their source_quotes. Only approved entities are included. The LLM
 * is instructed to answer ONLY from these quotes, citing chunk IDs.
 */
export async function buildBrainContext(): Promise<{
  chunks: ContextChunk[];
  contextText: string;
}> {
  const a = await loadAnalysis();
  const chunks: ContextChunk[] = [];

  for (const p of a.pains) {
    if (p.review?.status === 'rejected') continue;
    chunks.push({
      id: p.id,
      kind: 'pain',
      title: p.title,
      body: p.description,
      quotes: p.source_quotes.map((q) => ({
        text: q.text,
        speaker: q.speaker,
        confidence: q.confidence,
      })),
    });
  }
  for (const r of a.risks) {
    if (r.review?.status === 'rejected') continue;
    chunks.push({
      id: r.id,
      kind: 'risk',
      title: r.title,
      body: r.description,
      quotes: r.source_quotes.map((q) => ({
        text: q.text,
        speaker: q.speaker,
        confidence: q.confidence,
      })),
    });
  }
  for (const pr of a.processes) {
    if (pr.review?.status === 'rejected') continue;
    chunks.push({
      id: pr.id,
      kind: 'process',
      title: pr.name,
      body: pr.description,
      quotes: pr.source_quotes.slice(0, 2).map((q) => ({
        text: q.text,
        speaker: q.speaker,
        confidence: q.confidence,
      })),
    });
  }
  // Top 5 ranked plays as context
  for (const playId of a.ranked_opportunities.slice(0, 5)) {
    const match = a.play_matches.find((m) => m.play_id === playId);
    if (!match) continue;
    chunks.push({
      id: match.play_id,
      kind: 'play',
      title: match.play_id,
      body: match.reasoning,
      quotes: [],
    });
  }

  const contextText = chunks
    .map((c) => {
      const quoteBlock = c.quotes
        .map((q) => `  - "${q.text}" (${q.speaker ?? 'n/a'}, conf=${q.confidence})`)
        .join('\n');
      return [
        `[${c.id}] kind=${c.kind}`,
        `title: ${c.title}`,
        `body: ${c.body}`,
        quoteBlock ? `quotes:\n${quoteBlock}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n---\n\n');

  return { chunks, contextText };
}
