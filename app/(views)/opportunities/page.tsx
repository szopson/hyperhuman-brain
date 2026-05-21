import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { PLAYS, getPlayById } from '@/lib/plays/library';
import { Badge } from '@/components/ui/badge';
import { PlayDetailDrawer } from '@/components/shared/PlayDetailDrawer';
import { cn } from '@/lib/utils';

const LAYER_COLOR: Record<string, string> = {
  brain: 'bg-violet-950 text-violet-200 ring-violet-800',
  'founder-facing': 'bg-amber-950 text-amber-200 ring-amber-800',
  tools: 'bg-cyan-950 text-cyan-200 ring-cyan-800',
  skills: 'bg-emerald-950 text-emerald-200 ring-emerald-800',
  workflows: 'bg-blue-950 text-blue-200 ring-blue-800',
  cowork: 'bg-zinc-900 text-zinc-300 ring-zinc-800',
};

const LAYER_LABEL: Record<string, string> = {
  brain: 'Fundament',
  'founder-facing': 'Dla zarządu',
  tools: 'Narzędzie',
  skills: 'Automatyzacja',
  workflows: 'Workflow',
  cowork: 'Wdrożenie zespołu',
};

export default async function Page() {
  const a = await loadAnalysis();
  const rows = a.play_matches.slice(0, 15);
  const prereqsLookup: Record<string, string> = Object.fromEntries(
    PLAYS.map((p) => [p.id, p.name_pl ?? p.name]),
  );

  return (
    <AppShell active="opportunities">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            06 · Co warto wdrożyć
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            {a.play_matches.length} dopasowanych wdrożeń — top {rows.length} pokazanych
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Ocena końcowa łączy: jak duży wpływ biznesowy (30%), czy AI ma sens
            (15%), gotowość do wdrożenia (25%), łatwość wdrożenia (15%), gotowość
            danych (15%). Wdrożenia dla zarządu dostają dodatkowe +10 punktów w
            fazie &bdquo;pułapki średniego rozwoju&rdquo;. Kliknij ocenę aby
            zobaczyć szczegóły.
          </p>
        </header>

        <div className="overflow-x-auto rounded-md border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  #
                </th>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  Wdrożenie
                </th>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  Ocena
                </th>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  Wpływ
                </th>
                <th
                  className="border-l border-zinc-800 px-3 py-3 text-center font-medium"
                  rowSpan={2}
                >
                  AI?
                </th>
                <th
                  className="border-l border-zinc-800 px-3 py-2 text-center font-medium"
                  colSpan={4}
                >
                  Gotowość do wdrożenia
                </th>
                <th
                  className="border-l border-zinc-800 px-3 py-3 font-medium"
                  rowSpan={2}
                >
                  Łatwość
                </th>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  Czas
                </th>
                <th className="px-3 py-3 font-medium" rowSpan={2}>
                  PLN/m-c
                </th>
              </tr>
              <tr className="text-[10px] text-zinc-600">
                <th className="border-l border-zinc-800 px-3 py-1 text-center">
                  Wiedza
                </th>
                <th className="px-3 py-1 text-center">Narzędz.</th>
                <th className="px-3 py-1 text-center">Integr.</th>
                <th className="px-3 py-1 text-center">Skille</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((m, i) => {
                const play = getPlayById(m.play_id);
                if (!play) return null;
                const c = m.cavac_readiness;
                const isFounderFacing = play.cavac_layer === 'founder-facing';
                const mvp = play.effort_weeks_mvp?.typical;
                const full = play.effort_weeks.typical;
                return (
                  <tr
                    key={m.play_id}
                    className={cn(
                      'transition hover:bg-zinc-900/50',
                      isFounderFacing &&
                        'bg-amber-950/30 ring-1 ring-amber-900/40',
                    )}
                  >
                    <td className="px-3 py-3 font-mono text-zinc-500">{i + 1}</td>
                    <td className="px-3 py-3 max-w-md">
                      <div className="flex items-center gap-2">
                        {isFounderFacing && (
                          <Badge className="bg-amber-900 text-amber-100 ring-1 ring-amber-700 text-[10px]">
                            Dla zarządu
                          </Badge>
                        )}
                        <Badge
                          className={cn(
                            'ring-1 text-[10px]',
                            LAYER_COLOR[play.cavac_layer],
                          )}
                        >
                          {LAYER_LABEL[play.cavac_layer] ?? play.cavac_layer}
                        </Badge>
                      </div>
                      <p className="mt-1 text-zinc-100">{play.name_pl ?? play.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                        {play.one_liner}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <PlayDetailDrawer
                        play={play}
                        match={m}
                        prereqsLookup={prereqsLookup}
                        className="font-mono text-base font-semibold text-zinc-50 no-underline"
                      >
                        {m.composite_score}
                      </PlayDetailDrawer>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                      {m.business_impact_score.toFixed(1)}
                    </td>
                    <td className="border-l border-zinc-800 px-3 py-3 text-center font-mono text-xs text-zinc-300">
                      {m.ai_fit_score.toFixed(1)}
                    </td>
                    <td className="border-l border-zinc-800 px-3 py-3 text-center font-mono text-xs text-zinc-400">
                      {c.knowledge.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs text-zinc-400">
                      {c.tools.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs text-zinc-400">
                      {c.integrations.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs text-zinc-400">
                      {c.skills.toFixed(1)}
                    </td>
                    <td className="border-l border-zinc-800 px-3 py-3 font-mono text-xs text-zinc-300">
                      {m.implementation_ease_score.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                      {mvp ? (
                        <>
                          <span className="text-emerald-300">{mvp}t</span>
                          <span className="text-zinc-600"> / {full}t</span>
                        </>
                      ) : (
                        `${full}t`
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                      {m.estimated_impact_pln_monthly
                        ? `${(m.estimated_impact_pln_monthly / 1000).toFixed(0)}k`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-zinc-500">
          Wdrożenia &bdquo;dla zarządu&rdquo; są wyróżnione bursztynowym tłem.
          Czas Fazy 1 (skróconej, ale dającej 60-80% wartości) pokazany na
          zielono jeśli zdefiniowany. &bdquo;t&rdquo; = tygodnie.
        </p>
      </div>
    </AppShell>
  );
}
