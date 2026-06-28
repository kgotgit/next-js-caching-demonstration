'use cache'

import { cacheLife } from 'next/cache'
import { expensiveWork } from '@/lib/demo'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { ReadingCard } from '@/components/reading-card'
import { CodeBlock } from '@/components/code-block'
import { ReloadButton } from '@/components/reload-button'

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
