import { AppShell } from '@/components/layout/AppShell';
import { loadAnalysis } from '@/lib/storage/load-analysis';
import { Badge } from '@/components/ui/badge';
import { InspectTrigger } from '@/components/shared/InspectDrawer';
import { cn } from '@/lib/utils';

const THREAT_COLOR: Record<string, string> = {
  existential: 'bg-rose-900/70 text-rose-100 ring-rose-700',
  high: 'bg-rose-950/60 text-rose-200 ring-rose-800',
  medium: 'bg-amber-950/60 text-amber-200 ring-amber-800',
  low: 'bg-zinc-800 text-zinc-300 ring-zinc-700',
  irrelevant: 'bg-zinc-900 text-zinc-500 ring-zinc-800',
};

const THREAT_ORDER = {
  existential: 4,
  high: 3,
  medium: 2,
  low: 1,
  irrelevant: 0,
};

export default async function Page() {
  const a = await loadAnalysis();
  const sorted = [...a.competitors].sort(
    (x, y) => THREAT_ORDER[y.threat_level] - THREAT_ORDER[x.threat_level],
  );

  return (
    <AppShell active="competitive">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            View 07 · Competitive Positioning
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
            {a.competitors.length} konkurentów zidentyfikowanych
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            5-dimensional positioning (inventory_model · revenue_model ·
            target_customer · geographic_reach · tech_stack_visibility) + threat
            level + reaction urgency. Click name aby zobaczyć source quotes.
          </p>
        </header>

        <div className="space-y-4">
          {sorted.map((c) => (
            <article
              key={c.id}
              className={cn(
                'rounded-md border bg-zinc-900/40 p-5',
                c.threat_level === 'existential' || c.threat_level === 'high'
                  ? 'border-rose-900/60'
                  : 'border-zinc-800',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-zinc-50">
                      <InspectTrigger
                        payload={{
                          title: c.name,
                          subtitle: c.model,
                          quotes: c.source_quotes,
                          extra: [
                            { label: 'inventory_model', value: c.positioning.inventory_model },
                            { label: 'revenue_model', value: c.positioning.revenue_model },
                            { label: 'target_customer', value: c.positioning.target_customer },
                            { label: 'geographic_reach', value: c.positioning.geographic_reach },
                            { label: 'tech_stack', value: c.positioning.tech_stack_visibility },
                            {
                              label: 'revenue',
                              value: c.scale_estimate.revenue
                                ? `${c.scale_estimate.revenue.value.toLocaleString()} ${c.scale_estimate.revenue.currency}/${c.scale_estimate.revenue.period}`
                                : '—',
                            },
                            {
                              label: 'customers',
                              value: c.scale_estimate.customers ?? '—',
                            },
                            {
                              label: 'geo reach',
                              value:
                                c.scale_estimate.geo_reach?.join(', ') ?? '—',
                            },
                            {
                              label: 'growth rate',
                              value: c.scale_estimate.growth_rate ?? '—',
                            },
                          ],
                        }}
                      >
                        {c.name}
                      </InspectTrigger>
                    </h3>
                    <Badge
                      className={cn(
                        'ring-1 text-[10px]',
                        THREAT_COLOR[c.threat_level],
                      )}
                    >
                      threat · {c.threat_level}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-zinc-700 text-[10px]"
                    >
                      react · {c.time_to_react}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{c.model}</p>
                </div>
                {c.scale_estimate.revenue && (
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xl font-semibold text-zinc-50">
                      {(c.scale_estimate.revenue.value / 1_000_000).toFixed(1)}M{' '}
                      {c.scale_estimate.revenue.currency}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                      revenue · {c.scale_estimate.revenue.period}
                    </p>
                    {c.scale_estimate.growth_rate && (
                      <p className="mt-1 text-xs text-emerald-400">
                        ↑ {c.scale_estimate.growth_rate}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 5-DIM POSITIONING */}
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-5">
                {[
                  ['inventory', c.positioning.inventory_model],
                  ['revenue', c.positioning.revenue_model],
                  ['target', c.positioning.target_customer],
                  ['geo', c.positioning.geographic_reach],
                  ['tech', c.positioning.tech_stack_visibility],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      {k}
                    </dt>
                    <dd className="mt-0.5 text-zinc-300">{v}</dd>
                  </div>
                ))}
              </dl>

              {/* ADVANTAGES / DISADVANTAGES */}
              {(c.key_advantages.length > 0 || c.key_disadvantages.length > 0) && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {c.key_advantages.length > 0 && (
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400/80">
                        Ich przewagi
                      </p>
                      <ul className="mt-1 space-y-0.5 text-xs text-zinc-300">
                        {c.key_advantages.map((adv, i) => (
                          <li key={i}>+ {adv}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {c.key_disadvantages.length > 0 && (
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-rose-400/80">
                        Ich słabości
                      </p>
                      <ul className="mt-1 space-y-0.5 text-xs text-zinc-300">
                        {c.key_disadvantages.map((dis, i) => (
                          <li key={i}>− {dis}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
