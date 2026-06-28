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
      <dl className="mt-3 flex flex-col gap-1.5 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-cached bg-cached/30" />
          <span>
            <dt className="inline font-semibold text-foreground">Primary</dt>
            <dd className="inline"> — the tier that actually serves the response.</dd>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-border bg-card" />
          <span>
            <dt className="inline font-semibold text-foreground">Used</dt>
            <dd className="inline"> — holds a copy of the entry (e.g. stores or backs it up), but did not serve this request.</dd>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-border/60 bg-transparent" />
          <span>
            <dt className="inline font-semibold text-foreground">Not used</dt>
            <dd className="inline"> — plays no role for this directive.</dd>
          </span>
        </div>
      </dl>
      <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold text-foreground">
          How the tiers fill each other
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          A read travels <span className="font-medium text-foreground">down</span>{' '}
          the tiers and stops at the first one holding a fresh entry; the value
          it finds is then copied back{' '}
          <span className="font-medium text-foreground">up</span> into the faster
          tiers it skipped. That two-way movement is why a tier can store the
          data without being the one that served the request.
        </p>
        <ol className="mt-3 flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-mono font-semibold text-foreground">1.</span>
            <span>
              <span className="font-medium text-foreground">First visit (cold):</span>{' '}
              every tier misses, so the function runs, renders the value, and{' '}
              <span className="font-medium text-foreground">writes it down into L2</span>{' '}
              (the durable store). L2 is the source of truth — here it is both
              written and, effectively, primary.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono font-semibold text-foreground">2.</span>
            <span>
              <span className="font-medium text-foreground">Repeat visit, same warm instance:</span>{' '}
              the value is already in{' '}
              <span className="font-medium text-foreground">L1</span> (that
              instance&apos;s RAM), so L1 answers instantly and is{' '}
              <span className="font-medium text-foreground">Primary</span>. L2
              still holds the durable copy, so it stays{' '}
              <span className="font-medium text-foreground">Used</span> — it just
              was not read this time.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono font-semibold text-foreground">3.</span>
            <span>
              <span className="font-medium text-foreground">Cold start or a new instance:</span>{' '}
              L1 is empty (RAM does not survive teardown), so the server reads{' '}
              <span className="font-medium text-foreground">L2</span> and copies
              the entry back up to repopulate L1. Without re-running the
              function, every instance ends up serving the same cached value.
            </span>
          </li>
        </ol>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          So <span className="font-medium text-foreground">L1</span> is the fast,
          per-instance front for reads, while{' '}
          <span className="font-medium text-foreground">L2</span> is the durable,
          shared backing store that persists entries and rehydrates L1 — which is
          exactly what &quot;Used&quot; means when L1 is the one serving.
        </p>
      </div>
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
