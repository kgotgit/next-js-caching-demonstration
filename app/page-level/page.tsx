'use cache'

import { cacheLife } from 'next/cache'
import { expensiveWork } from '@/lib/demo'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { CacheTiers } from '@/components/cache-tiers'
import { ReadingCard } from '@/components/reading-card'
import { CodeBlock } from '@/components/code-block'
import { ReloadButton } from '@/components/reload-button'
import Link from 'next/link'

// The 'use cache' directive at the TOP OF THE FILE caches the entire route.
// Because this page reads no runtime data (no cookies/headers/searchParams),
// Next.js can render it during the build and fold the whole thing into the
// static shell. Every visitor gets the exact same prerendered HTML until the
// cache revalidates.
//
// Note: when 'use cache' is at file level, every export must be an async function.

export default async function PageLevelDemo() {
  // Keep the prerendered output for ~1 day before revalidating.
  cacheLife('days')

  // This line only prints when the page body actually runs (build time or a
  // revalidation). If you refresh and see NO new log, the static shell was
  // served straight from cache — a cache HIT.
  console.log(`[v0] page-level 'use cache' — function BODY EXECUTED at ${new Date().toISOString()}`)

  const reading = await expensiveWork('Page-level use cache', 600)

  return (
    <div className="flex flex-col gap-10">
      <DemoHeader
        directive="'use cache' · file level"
        title="Page-level caching"
        description="Adding 'use cache' to the top of a page (and layout) caches the entire route. With no runtime APIs in play, the page is fully prerendered into the static shell at build time and served instantly."
        timing="Build time"
        storage="Static shell (prerendered HTML + RSC payload)"
      >
        <CacheTiers
          tiers={{
            L0: {
              status: 'primary',
              note: 'Prerendered at build and served straight from the edge — the function is never invoked.',
            },
            L1: {
              status: 'used',
              note: 'Warms in instance memory if a function ever renders the route.',
            },
            L2: {
              status: 'used',
              note: 'Backed by the durable store across instances and restarts.',
            },
          }}
        />
        <ObserveHint
          items={[
            'The timestamp and token below were captured once, when the page was prerendered.',
            'Press Refresh as many times as you like — the values never change, because no work runs per request.',
            'In production, these values only change when the build is re-run or the cache is revalidated.',
          ]}
        />
      </DemoHeader>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Prerendered output
          </h2>
          <ReloadButton />
        </div>
        <ReadingCard
          variant="cached"
          title="Captured during prerender"
          reading={reading}
          note="Frozen into the static shell. Identical for every visitor until the cache lifetime ('days') elapses or the app is rebuilt."
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-card-foreground">
          Want this generated on first request instead of at build?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A plain route like this is always prerendered at build when fully
          cacheable. To defer generation to the first request (ISR /{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            fallback: true
          </code>
          ), use a dynamic route with a partial{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            generateStaticParams
          </code>
          . See the dedicated{' '}
          <Link
            href="/dynamic-isr"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Dynamic ISR
          </Link>{' '}
          example.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The code
        </h2>
        <CodeBlock
          className="mt-4"
          filename="app/page-level/page.tsx"
          code={`'use cache'

import { cacheLife } from 'next/cache'

export default async function PageLevelDemo() {
  cacheLife('days') // revalidate the whole route once per day

  const reading = await getExpensiveData()
  return <ReadingCard reading={reading} />
}`}
        />
      </section>
    </div>
  )
}
