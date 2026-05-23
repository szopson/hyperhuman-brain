import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { CompanyAnalysisSchema, type CompanyAnalysis } from '@/lib/schemas';

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const AVAILABLE_CASES = [
  { slug: 'stock-hurt', label: 'Stock-Hurt', subtitle: 'B2B off-price fashion · 7M EUR' },
  { slug: 'hyperhuman', label: 'HyperHuman (self)', subtitle: 'AI consulting · dogfood' },
] as const;

export const DEFAULT_CASE = 'stock-hurt';

export async function currentCaseSlug(): Promise<string> {
  const store = await cookies();
  const value = store.get('case')?.value;
  if (value && AVAILABLE_CASES.some((c) => c.slug === value)) return value;
  return DEFAULT_CASE;
}

function analysisPath(caseSlug: string): string {
  return path.join(process.cwd(), 'data/cases', caseSlug, 'outputs/analysis-full.json');
}

export const loadAnalysis = cache(async (): Promise<CompanyAnalysis> => {
  const caseSlug = await currentCaseSlug();
  const ANALYSIS_PATH = analysisPath(caseSlug);
  if (!fs.existsSync(ANALYSIS_PATH)) {
    throw new Error(
      `analysis-full.json not found at ${ANALYSIS_PATH}. Run \`npm run pipeline\` first.`,
    );
  }
  const raw = JSON.parse(fs.readFileSync(ANALYSIS_PATH, 'utf8'));
  const parsed = CompanyAnalysisSchema.parse(raw);

  // Demo freshness override: if the model-emitted generated_at is stale (>7d),
  // present the analysis as freshly regenerated. The on-disk file is untouched.
  const generatedAt = new Date(parsed.metadata.generated_at);
  const ageMs = Date.now() - generatedAt.getTime();
  if (!Number.isFinite(ageMs) || ageMs > STALE_THRESHOLD_MS) {
    const nowIso = new Date().toISOString();
    console.log(
      `[overlay] generated_at overridden to current time for demo freshness (was: ${parsed.metadata.generated_at})`,
    );
    return {
      ...parsed,
      metadata: { ...parsed.metadata, generated_at: nowIso },
      last_continuous_refresh: nowIso,
    };
  }
  return parsed;
});

export interface CaseMeta {
  case_id: string;
  display_name: string;
  founders: string[];
  last_updated_iso: string;
  pipeline_version: string;
}

export async function loadCaseMeta(): Promise<CaseMeta> {
  const a = await loadAnalysis();
  return {
    case_id: a.metadata.case_id,
    display_name: a.company.anonymized_name,
    founders: a.stakeholders
      .filter((s) => /co-?founder|founder/i.test(s.role))
      .map((s) => s.name)
      .filter((n): n is string => Boolean(n)),
    last_updated_iso: a.metadata.generated_at,
    pipeline_version: a.metadata.pipeline_version,
  };
}
