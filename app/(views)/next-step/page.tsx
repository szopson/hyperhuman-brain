import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { getPlayById } from '@/lib/plays/library';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LAYER_COLOR: Record<string, string> = {
  brain: 'bg-violet-950 text-violet-200 ring-violet-800',
  'founder-facing': 'bg-amber-950 text-amber-200 ring-amber-800',
  tools: 'bg-cyan-950 text-cyan-200 ring-cyan-800',
  skills: 'bg-emerald-950 text-emerald-200 ring-emerald-800',
  workflows: 'bg-blue-950 text-blue-200 ring-blue-800',
  cowork: 'bg-zinc-900 text-zinc-300 ring-zinc-800',
};

export default async function Page() {
  const a = await loadAnalysis();
  const pack = a.next_step_pack;
  const selectedPlays = pack.selected_plays
    .map((id) => ({ id, play: getPlayById(id), match: a.play_matches.find((m) => m.play_id === id) }))
    .filter((x) => x.play);

  // Layer 2 sneak peek: top 3 plays NOT in pack, sorted by composite.
  const layer2 = a.play_matches
    .filter((m) => !pack.selected_plays.includes(m.play_id))
    .slice(0, 3)
    .map((m) => ({ match: m, play: getPlayById(m.play_id) }))
    .filter((x) => x.play);

  return (
    <AppShell active="next-step">
      <div className="mx-auto max-w-5xl space-y-10">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            View 09 · Recommended Next Step
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            Founder Brain Foundation + Sales Department Layer
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">{pack.one_liner}</p>
        </header>

        {/* TIMELINE + COMPOSITION HERO */}
        <section className="rounded-xl border border-amber-900/50 bg-gradient-to-br from-amber-950/30 to-zinc-950 p-6">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300/80">
                Timeline
              </p>
              <p className="mt-1 text-4xl font-semibold text-zinc-50">
                {pack.timeline_weeks}{' '}
                <span className="text-xl text-zinc-500">tygodni</span>
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300/80">
                Plays
              </p>
              <p className="mt-1 text-4xl font-semibold text-zinc-50">
                {pack.selected_plays.length}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300/80">
                Framing
              </p>
              <p className="mt-1 text-xl font-semibold capitalize text-zinc-50">
                {pack.framing}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-zinc-300">{pack.rationale}</p>
        </section>

        {/* SELECTED PLAYS */}
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Selected plays · pakiet pierwszy
          </h2>
          <ol className="mt-3 space-y-3">
            {selectedPlays.map(({ play, match }, i) => {
              if (!play) return null;
              const mvp = play.effort_weeks_mvp?.typical;
              const eff = mvp ?? play.effort_weeks.typical;
              return (
                <li
                  key={play.id}
                  className="rounded-md border border-zinc-800 bg-zinc-900/50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-zinc-500">
                          0{i + 1} · {play.id}
                        </span>
                        <Badge
                          className={cn(
                            'ring-1 text-[10px]',
                            LAYER_COLOR[play.cavac_layer],
                          )}
                        >
                          {play.cavac_layer}
                        </Badge>
                        {mvp && (
                          <Badge className="bg-emerald-950 text-emerald-300 ring-1 ring-emerald-800 text-[10px]">
                            MVP {mvp}w (full {play.effort_weeks.typical}w)
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-zinc-50">
                        {play.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        {play.one_liner}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-2xl font-semibold text-zinc-50">
                        {match?.composite_score ?? '—'}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                        composite
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                    <div>
                      <p className="text-zinc-500">Effort</p>
                      <p className="mt-0.5 font-mono text-zinc-200">{eff}w</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Matched pains</p>
                      <p className="mt-0.5 font-mono text-zinc-200">
                        {match?.matched_pains.length ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Confidence</p>
                      <p className="mt-0.5 font-mono uppercase text-zinc-200">
                        {match?.confidence ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">€/mo recoverable</p>
                      <p className="mt-0.5 font-mono text-zinc-200">
                        {match?.estimated_impact_pln_monthly
                          ? `${(match.estimated_impact_pln_monthly / 1000).toFixed(0)}k PLN`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-zinc-400">
                    <span className="font-medium text-zinc-300">
                      Expected impact:
                    </span>{' '}
                    {play.expected_impact_qualitative}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* DELIVERABLES */}
        {pack.deliverables.length > 0 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Deliverables
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
              {pack.deliverables.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-zinc-600">▸</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* TEAM + COMMITMENT */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Team required
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
              {pack.team_required.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Client commitment
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
              {pack.client_commitment.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* RISKS + ASSUMPTIONS */}
        {pack.risks_and_assumptions.length > 0 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Risks & assumptions
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
              {pack.risks_and_assumptions.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-500">▲</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* LAYER 2 SNEAK PEEK */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Layer 2 · next logical step after success
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            {pack.next_logical_step_after}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {layer2.map(({ play, match }) => {
              if (!play) return null;
              return (
                <div
                  key={play.id}
                  className="rounded-md border border-zinc-800 bg-zinc-950 p-3"
                >
                  <p className="font-mono text-xs text-zinc-500">{play.id}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-100">
                    {play.name}
                  </p>
                  <p className="mt-2 font-mono text-xs text-zinc-400">
                    composite {match.composite_score} · {play.effort_weeks.typical}w
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
