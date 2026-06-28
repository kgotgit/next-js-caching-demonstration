import { Suspense } from 'react'
import { cacheLife } from 'next/cache'
import { expensiveWork } from '@/lib/demo'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { CacheTiers } from '@/components/cache-tiers'
import { ReadingCard, ReadingCardSkeleton } from '@/components/reading-card'
import { LiveReading } from '@/components/live-reading'
import { CodeBlock } from '@/components/code-block'
import { ReloadButton } from '@/components/reload-button'

// Only THIS FUNCTION is cached — not the whole page. The page itself stays
// dynamic so it can also render live, streamed content. The cached result is
// shared everywhere the function is called and deduped within a render.
async function getCachedReading() {
  'use cache'
  cacheLife('minutes')
  // Prints ONCE per cache window. Called twice per render but you'll see a
  // single log on a MISS; refresh within the window and no new log = HIT.
  console.log(`[v0] function-level 'use cache' — function BODY EXECUTED at ${new Date().toISOString()}`)
  return expensiveWork('Function-level use cache', 800)
}

async function CachedTwice() {
  // Called twice, but the 800ms work runs at most once per cache window —
  // both cards show the SAME frozen value.
  const [a, b] = await Promise.all([getCachedReading(), getCachedReading()])
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ReadingCard
        variant="cached"
        title="Call #1"
        reading={a}
        note="Cached output reused from memory."
      />
      <ReadingCard
        variant="cached"
        title="Call #2"
        reading={b}
        note="Identical to call #1 — same cache entry, deduped."
      />
    </div>
  )
}

export default function FunctionLevelDemo() {
  return (
    <div className="flex flex-col gap-10">
      <DemoHeader
        directive="'use cache' · function level"
        title="Function-level caching"
        description="Add 'use cache' inside a single async function to memoize just that data, independent of the UI. The same cached value is reused wherever the function is called, while the rest of the page can stay live."
        timing="Build time + runtime (in-memory)"
        storage="In-memory LRU (per cache key)"
      >
        <CacheTiers
          tiers={{
            L0: {
              status: 'unused',
              note: 'The page is dynamic (it also streams a live value), so it is never served whole from the edge.',
            },
            L1: {
              status: 'primary',
              note: "The 'use cache' result lives in the in-memory LRU, keyed by the function + args.",
            },
            L2: {
              status: 'used',
              note: 'Our logging cacheHandler persists it durably — watch the cacheHandler:default lines in the logs.',
            },
          }}
        />
        <ObserveHint
          items={[
            'The two CACHED cards are always identical — one cache entry, served twice.',
            'The LIVE card streams in behind Suspense and changes on every refresh.',
            'Refresh repeatedly: cached stays frozen for the cacheLife window, live never does.',
          ]}
        />
      </DemoHeader>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Cached function output
          </h2>
          <ReloadButton />
        </div>
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadingCardSkeleton title="Call #1" />
              <ReadingCardSkeleton title="Call #2" />
            </div>
          }
        >
          <CachedTwice />
        </Suspense>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          For comparison — uncached
        </h2>
        <Suspense fallback={<ReadingCardSkeleton title="Live value (no cache)" />}>
          <LiveReading note="No 'use cache' here, so this runs on every request and always differs from the cached cards above." />
        </Suspense>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The code
        </h2>
        <CodeBlock
          className="mt-4"
          filename="app/function-level/page.tsx"
          code={`async function getCachedReading() {
  'use cache'
  cacheLife('minutes')
  return getExpensiveData()
}

// Reused anywhere — runs at most once per cache key
const [a, b] = await Promise.all([
  getCachedReading(),
  getCachedReading(),
])`}
        />
      </section>
    </div>
  )
}
