import { cn } from '@/lib/utils'
import { formatTime, type Reading } from '@/lib/demo'

type Variant = 'cached' | 'live'

const variantStyles: Record<
  Variant,
  { ring: string; chip: string; dot: string; label: string }
> = {
  cached: {
    ring: 'border-cached/40',
    chip: 'bg-cached/10 text-cached',
    dot: 'bg-cached',
    label: 'CACHED',
  },
  live: {
    ring: 'border-live/50',
    chip: 'bg-live/15 text-live-foreground',
    dot: 'bg-live',
    label: 'LIVE',
  },
}

type ReadingCardProps = {
  reading: Reading
  variant: Variant
  title: string
  /** Short note explaining what this value proves. */
  note?: string
}

export function ReadingCard({
  reading,
  variant,
  title,
  note,
}: ReadingCardProps) {
  const styles = variantStyles[variant]
  return (
    <div className={cn('rounded-xl border bg-card p-5', styles.ring)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
            styles.chip,
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              styles.dot,
              variant === 'live' && 'animate-pulse',
            )}
            aria-hidden
          />
          {styles.label}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-muted-foreground">Generated at</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-card-foreground">
            {formatTime(reading.generatedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Token</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-card-foreground">
            {reading.token}
          </dd>
        </div>
      </dl>

      <p className="mt-4 font-mono text-xs text-muted-foreground">
        {reading.source} · {reading.latencyMs}ms of simulated work
      </p>
      {note ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  )
}

export function ReadingCardSkeleton({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
          STREAMING
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-20 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="mt-4 h-3 w-40 animate-pulse rounded bg-muted" />
    </div>
  )
}
