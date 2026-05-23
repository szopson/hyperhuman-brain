import { AppShell } from '@/components/layout/AppShell';
import { loadPendingQueue } from '@/lib/storage/load-pending';
import { Badge } from '@/components/ui/badge';
import { ReviewActions } from '@/components/views/ReviewActions';
import { cn } from '@/lib/utils';
import { currentCaseSlug } from '@/lib/storage/load-analysis';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-900/40 text-amber-200 ring-amber-800',
  approved: 'bg-emerald-900/40 text-emerald-200 ring-emerald-800',
  rejected: 'bg-rose-900/40 text-rose-200 ring-rose-800',
};

const ENTITY_LABEL: Record<string, string> = {
  pain: 'pain',
  risk: 'risk',
  process_update: 'proces',
  metric: 'metryka',
  observation: 'obserwacja',
};

const ROLE_LABEL: Record<string, string> = {
  founder: 'founder',
  employee: 'pracownik',
  consultant: 'konsultant',
};

export default async function Page() {
  const caseSlug = await currentCaseSlug();
  const queue = loadPendingQueue(caseSlug);
  const pending = queue.entities.filter((e) => e.review.status === 'pending');
  const reviewed = queue.entities.filter((e) => e.review.status !== 'pending');

  return (
    <AppShell active="review">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            10 · Kolejka review · v0.2
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            {pending.length} {pending.length === 1 ? 'zgłoszenie do oceny' : 'zgłoszeń do oceny'}
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Phase A′ — daily ingestion. Pracownicy i founderzy zostawiają krótkie
            notatki (voice/form) o tym co dziś zaobserwowali. Manager lub developer
            weryfikuje sensowność przed wpisem do <span className="text-zinc-200">mózgu firmy</span>.
            Encje w statusie <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs">pending</code>
            {' '}nie wpływają na scoring ani na żadną liczbę w dashboardzie.
          </p>
        </header>

        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Pending — wymaga decyzji
          </h2>
          <div className="mt-3 space-y-3">
            {pending.length === 0 && (
              <p className="rounded border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                Pusta kolejka. Uruchom <code className="rounded bg-zinc-900 px-1.5 py-0.5">npm run ingest</code>
                {' '}aby zaciągnąć nowe wpisy z <code className="rounded bg-zinc-900 px-1.5 py-0.5">inputs/daily/</code>.
              </p>
            )}
            {pending.map((e) => {
              const payload = e.payload as { title?: string; description?: string };
              return (
                <article
                  key={e.id}
                  className="rounded-md border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <Badge
                      className={cn('ring-1', STATUS_COLOR[e.review.status])}
                    >
                      {e.review.status}
                    </Badge>
                    <Badge variant="outline" className="border-zinc-700">
                      {ENTITY_LABEL[e.entity_type] ?? e.entity_type}
                    </Badge>
                    <Badge variant="outline" className="border-zinc-800 text-zinc-400">
                      {ROLE_LABEL[e.author_role] ?? e.author_role} · {e.author_id}
                    </Badge>
                    <span className="font-mono text-zinc-600">
                      {e.source_type.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-zinc-600">
                      {new Date(e.ingested_at).toLocaleString('pl-PL', { hour12: false })}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-zinc-100">
                    {payload.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
                    {payload.description}
                  </p>
                  {e.related_entity_ids.length > 0 && (
                    <p className="mt-2 font-mono text-[11px] text-zinc-500">
                      → linkuje: {e.related_entity_ids.join(', ')}
                    </p>
                  )}
                  <div className="mt-3 border-t border-zinc-800 pt-3">
                    <ReviewActions caseSlug={caseSlug} entityId={e.id} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {reviewed.length > 0 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Już zdecydowane
            </h2>
            <div className="mt-3 space-y-2">
              {reviewed.map((e) => {
                const payload = e.payload as { title?: string };
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded border border-zinc-900 bg-zinc-950/50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        className={cn('ring-1 text-[9px]', STATUS_COLOR[e.review.status])}
                      >
                        {e.review.status}
                      </Badge>
                      <span className="truncate text-zinc-400">{payload.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-600">
                      {e.review.reviewed_by ?? '—'} ·{' '}
                      {e.review.reviewed_at
                        ? new Date(e.review.reviewed_at).toLocaleTimeString('pl-PL', { hour12: false })
                        : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-md border border-dashed border-emerald-900/50 bg-emerald-950/10 p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
            Dlaczego oddzielna kolejka
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Bootstrap mózgu (jednorazowa rozmowa z founderem) i daily ingestion
            (notatki zespołu) idą przez ten sam Zod schema i ten sam scoring,
            ale daily ingestion przechodzi przez bramkę human-in-the-loop.
            Powód: niska bariera wejścia dla pracowników (głos / krótki form) bez
            ryzyka, że hallucynacja LLM-a albo plotka zdeformuje &bdquo;centralny mózg&rdquo;.
            Dopiero approved encje trafiają do scoring i do publicznych widoków.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
