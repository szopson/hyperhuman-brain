'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AIPlay, PlayMatch } from '@/lib/schemas';

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'bg-emerald-900/40 text-emerald-300 ring-emerald-700/50',
  medium: 'bg-amber-900/40 text-amber-300 ring-amber-700/50',
  low: 'bg-rose-900/40 text-rose-300 ring-rose-700/50',
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'wysoka',
  medium: 'średnia',
  low: 'niska',
};

export function PlayDetailDrawer({
  play,
  match,
  prereqsLookup,
  children,
  className,
}: {
  play: AIPlay;
  match: PlayMatch;
  /** id → polish name map for prerequisite cross-reference */
  prereqsLookup: Record<string, string>;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const displayName = play.name_pl ?? play.name;
  const displaySolution = play.solution_pattern_pl ?? play.solution_pattern;
  const mvp = play.effort_weeks_mvp?.typical;

  return (
    <>
      <button
        type="button"
        data-inspect-trigger
        onClick={() => setOpen(true)}
        className={cn(
          'group cursor-pointer text-left',
          'underline decoration-zinc-700 decoration-dotted underline-offset-4',
          'hover:decoration-zinc-400 hover:text-zinc-50',
          className,
        )}
      >
        {children}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-zinc-50">{displayName}</SheetTitle>
            <SheetDescription className="text-zinc-400">
              {play.one_liner}
            </SheetDescription>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <Badge className="bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700">
                Ocena: {match.composite_score}/100
              </Badge>
              <Badge className="bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700">
                Czas: {mvp ? `${mvp} tyg. (Faza 1)` : `${play.effort_weeks.typical} tyg.`}
              </Badge>
              <Badge
                className={cn(
                  'ring-1',
                  CONFIDENCE_COLOR[match.confidence],
                )}
              >
                Pewność: {CONFIDENCE_LABEL[match.confidence]}
              </Badge>
            </div>
          </SheetHeader>

          <div className="px-4 pb-8">
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="bg-zinc-900">
                <TabsTrigger value="overview">Opis i architektura</TabsTrigger>
                <TabsTrigger value="scoring">Scoring i źródła</TabsTrigger>
              </TabsList>

              {/* TAB 1: OVERVIEW */}
              <TabsContent value="overview" className="space-y-6 pt-4">
                <section>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Jak to działa
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-zinc-300">
                    {displaySolution}
                  </p>
                </section>

                <section>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Czego potrzebujemy
                  </h3>
                  <div className="mt-2 space-y-3">
                    {play.requires.data.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-500">Dane</p>
                        <ul className="mt-1 space-y-0.5 text-sm text-zinc-300">
                          {play.requires.data.map((d, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-zinc-600">▸</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {play.requires.integrations_mcp.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-500">Integracje</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {play.requires.integrations_mcp.map((m, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="border-cyan-900/50 bg-cyan-950/30 text-cyan-200 text-[11px]"
                            >
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {play.requires.skills_to_write.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-500">Skille do napisania</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {play.requires.skills_to_write.map((s, i) => (
                            <code
                              key={i}
                              className="rounded bg-emerald-950/40 px-1.5 py-0.5 text-[11px] text-emerald-200 ring-1 ring-emerald-900/60"
                            >
                              {s}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                    {play.requires.custom_tools.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-500">Własne narzędzia</p>
                        <ul className="mt-1 space-y-0.5 text-sm text-zinc-300">
                          {play.requires.custom_tools.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-zinc-600">▸</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>

                {play.prerequisites.length > 0 && (
                  <section>
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                      Najpierw potrzebne
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                      {play.prerequisites.map((pid) => {
                        const name = prereqsLookup[pid] ?? pid;
                        return (
                          <li key={pid} className="flex gap-2">
                            <span className="text-zinc-600">→</span>
                            <span>{name}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                <section>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Oczekiwany efekt
                  </h3>
                  <p className="mt-2 text-sm text-zinc-300">
                    {play.expected_impact_qualitative}
                  </p>
                  {play.expected_impact_quantitative && (
                    <p className="mt-3 rounded-md bg-emerald-950/20 p-3 text-sm font-medium text-emerald-200 ring-1 ring-emerald-900/40">
                      {play.expected_impact_quantitative}
                    </p>
                  )}
                </section>
              </TabsContent>

              {/* TAB 2: SCORING */}
              <TabsContent value="scoring" className="space-y-6 pt-4">
                <section>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Jak liczona jest ocena
                  </h3>
                  <div className="mt-2 rounded-md border border-zinc-800 bg-zinc-900 p-3">
                    <p className="text-sm text-zinc-300">
                      Ocena końcowa:{' '}
                      <span className="font-mono text-zinc-50">
                        {match.composite_score}
                      </span>
                      <span className="text-zinc-500"> / 100</span>
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Wzór:{' '}
                      <span className="font-mono text-zinc-400">
                        0.3·Wpływ + 0.15·AI? + 0.25·Gotowość + 0.15·Łatwość +
                        0.15·Dane
                      </span>
                    </p>
                    <pre className="mt-3 overflow-x-auto rounded bg-zinc-950 p-2 text-[11px] leading-relaxed text-zinc-300">
                      {JSON.stringify(
                        {
                          wpływ_biznesowy: match.business_impact_score,
                          ai_ma_sens: match.ai_fit_score,
                          gotowość_do_wdrożenia: match.cavac_readiness,
                          łatwość_wdrożenia: match.implementation_ease_score,
                          gotowość_danych: match.data_readiness_score,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Uzasadnienie
                  </h3>
                  <p className="mt-2 text-sm text-zinc-300">{match.reasoning}</p>
                  {match.caveats.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-amber-300">
                      {match.caveats.map((c, i) => (
                        <li key={i}>▲ {c}</li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Skąd to wiemy
                  </h3>
                  <p className="mt-2 text-xs text-zinc-500">
                    Wdrożenia w bibliotece są skatalogowane na podstawie wzorców
                    z branży i poprzednich projektów HyperHuman (np. pipeline
                    leadów B2B z projektu WSA logistycznego). Konkretne dopasowanie
                    do problemów firmy bazuje na cytatach z transkryptu —
                    inspectable w widokach &bdquo;Gdzie boli&rdquo; i
                    &bdquo;Mapa procesów&rdquo;.
                  </p>
                </section>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
