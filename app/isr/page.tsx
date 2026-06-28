import { Suspense } from 'react'
import { cacheLife, cacheTag, updateTag } from 'next/cache'
import { expensiveWork } from '@/lib/demo'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { CacheTiers } from '@/components/cache-tiers'
import { ReadingCard, ReadingCardSkeleton } from '@/components/reading-card'
import { LiveReading } from '@/components/live-reading'
import { CodeBlock } from '@/components/code-block'
import { ReloadButton } from '@/components/reload-button'

// ISR-style behavior with Cache Components:
//  - cacheLife controls TIME-BASED revalidation (stale-while-revalidate).
//  - cacheTag labels the entry so it can be invalidated ON DEMAND.
async function getStat() {
  'use cache'
  // After `revalidate` seconds the entry is served stale once while it
  // refreshes in the background — the classic ISR pattern.
  cacheLife({ stale: 5, revalidate: 10, expire: 30 })
  cacheTag('isr-stat')
  // Watch this in the logs: frozen within the window (no log), then a new log
  // appears when it regenerates after the revalidate window or an updateTag.
  console.log(`[v0] isr 'use cache' — REGENERATED at ${new Date().toISOString()}`)
  return expensiveWork('ISR cached stat', 500)
}

// Server Action: invalidate the tag immediately for on-demand revalidation.
async function revalidateNow() {
  'use server'
  updateTag('isr-stat')
}

async function CachedStat() {
  const reading = await getStat()
  return (
    <ReadingCard
      variant="cached"
      title="ISR-cached value"
      reading={reading}
      note="Revalidates automatically 10s after it was generated, or instantly when you invalidate the 'isr-stat' tag below."
    />
  )
}

export default function IsrDemo() {
  return (
    <div className="flex flex-col gap-10">
      <DemoHeader
        directive="cacheLife + cacheTag + updateTag"
        title="ISR-style revalidation"
        description="Incremental Static Regeneration lives on top of 'use cache'. cacheLife sets a stale-while-revalidate window for time-based refresh, while cacheTag + updateTag/revalidateTag give you precise on-demand invalidation from Server Actions."
        timing="Build time, refreshed in the background at request time"
        storage="In-memory / cache handler (tagged entry)"
      >
        <CacheTiers
          tiers={{
            L0: {
              status: 'unused',
              note: 'The live comparison panel keeps the route dynamic, so the whole page is not edge-served.',
            },
            L1: {
              status: 'used',
              note: 'The tagged entry warms in memory for the life of the instance.',
            },
            L2: {
              status: 'primary',
              note: 'The durable store holds the tagged entry; updateTag invalidates it — watch for cacheHandler:default INVALIDATE.',
            },
          }}
        />
        <ObserveHint
          items={[
            'Refresh within 10s: the value is frozen (served from cache).',
            'Wait past the 10s revalidate window, then refresh twice: the first serves stale, the next shows freshly regenerated data.',
            'Click "Revalidate now" to invalidate the tag immediately — the value regenerates on the next render.',
          ]}
        />
      </DemoHeader>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tagged cache entry
          </h2>
          <div className="flex items-center gap-3">
            <form action={revalidateNow}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Revalidate now
              </button>
            </form>
            <ReloadButton />
          </div>
        </div>
        <Suspense fallback={<ReadingCardSkeleton title="ISR-cached value" />}>
          <CachedStat />
        </Suspense>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          For comparison — uncached
        </h2>
        <Suspense fallback={<ReadingCardSkeleton title="Live value (no cache)" />}>
          <LiveReading note="Always regenerates, ignoring any revalidation window." />
        </Suspense>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The code
        </h2>
        <CodeBlock
          className="mt-4"
          filename="app/isr/page.tsx"
          code={`async function getStat() {
  'use cache'
  cacheLife({ stale: 5, revalidate: 10, expire: 30 })
  cacheTag('isr-stat')
  return getExpensiveData()
}

// On-demand invalidation from a Server Action
async function revalidateNow() {
  'use server'
  updateTag('isr-stat')
}`}
        />
      </section>
    </div>
  )
}
