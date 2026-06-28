import {
  TIER_META,
  TIER_ORDER,
  type TierMap,
  type TierStatus,
} from '@/lib/cache-tiers'

const STATUS_LABEL: Record<TierStatus, string> = {
  primary: 'Primary',
  used: 'Used',
  unused: 'Not used',
}

function tileClasses(status: TierStatus) {
  switch (status) {
    case 'primary':
      return 'border-cached bg-cached/10'
    case 'used':
      return 'border-border bg-card'
    case 'unused':
      return 'border-dashed border-border/60 bg-transparent opacity-55'
  }
}

function badgeClasses(status: TierStatus) {
  switch (status) {
    case 'primary':
      return 'bg-cached/20 text-cached'
    case 'used':
      return 'bg-muted text-muted-foreground'
    case 'unused':
      return 'bg-transparent text-muted-foreground'
  }
}

// Renders the four caching tiers as a horizontal strip, highlighting which ones
// participate for a given example. Pass a per-tier note to override the generic
// description with directive-specific context.
export function CacheTiers({ tiers }: { tiers: TierMap }) {
  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5">
      <p className="text-sm font-semibold text-foreground">
        Where it is served from
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Lookup order is left to right — the first tier with a fresh entry wins.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TIER_ORDER.map((id) => {
          const entry = tiers[id]
          const status: TierStatus = entry?.status ?? 'unused'
          const meta = TIER_META[id]
          return (
            <li
              key={id}
              className={`flex flex-col rounded-lg border p-4 ${tileClasses(status)}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">
                  {meta.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClasses(status)}`}
                >
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <span className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {meta.where}
              </span>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {entry?.note ?? meta.desc}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
