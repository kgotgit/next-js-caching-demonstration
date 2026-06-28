import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { CacheTiers } from '@/components/cache-tiers'
import { ReadingCard } from '@/components/reading-card'
import { CodeBlock } from '@/components/code-block'
import { expensiveWork } from '@/lib/demo'

// INNER cache — imagine this is a shared data function or a wrapped fetch().
// It has its own lifetime and its own tag.
async function getInnerData() {
  'use cache'
  cacheLife('hours')
  cacheTag('composition-inner')
  console.log(
    `[v0] composition INNER 'use cache' — BODY EXECUTED at ${new Date().toISOString()}`,
  )
  return expensiveWork('Composition · inner (fetch-level)', 400)
}

// OUTER cache — the whole page. Its output EMBEDS the inner cache's output,
// so the outer entry inherits the inner's tags. Invalidating the inner tag
// therefore also purges this page entry (verified in the logs).
export default async function CompositionDemo() {
  'use cache'
  cacheLife('hours')
  cacheTag('composition-page')
  console.log(
    `[v0] composition OUTER page 'use cache' — BODY EXECUTED at ${new Date().toISOString()}`,
  )

  const outerReading = await expensiveWork('Composition · outer page', 400)
  const innerReading = await getInnerData()

  return (
    <div className="flex flex-col gap-10">
      <DemoHeader
        directive="'use cache' nested in 'use cache'"
        title="Composing caches: nesting & invalidation"
        description="An outer page-level cache that embeds an inner fetch/function-level cache. The page's output includes the inner result, so the inner's tags propagate up to the page entry."
        timing="Build time (regenerates on demand)"
        storage="Durable store (L2)"
      >
        <CacheTiers
          tiers={{
            L0: {
              status: 'primary',
              note: 'The composed page is prerendered and edge-served.',
            },
            L1: {
              status: 'used',
              note: 'Both entries warm in instance memory.',
            },
            L2: {
              status: 'primary',
              note: 'Outer page + inner entry both persist durably — watch both cacheHandler:default lines.',
            },
          }}
        />
        <ObserveHint
          items={[
            'Both cards were captured together when the page was generated.',
            "Invalidate ONLY 'composition-inner' from the webhook — the OUTER timestamp changes too, proving tags bubble up.",
            "Invalidating 'composition-page' regenerates the page, which also re-runs the inner cache.",
            'Watch the logs: both INNER and OUTER "BODY EXECUTED" print on the next visit after either tag is invalidated.',
          ]}
        />
      </DemoHeader>

      <section className="grid gap-4 sm:grid-cols-2">
        <ReadingCard
          reading={outerReading}
          variant="cached"
          title="Outer page cache"
          note="Tagged 'composition-page'. Frozen until either tag is invalidated."
        />
        <ReadingCard
          reading={innerReading}
          variant="cached"
          title="Inner (fetch-level) cache"
          note="Tagged 'composition-inner'. Embedded in the page above."
        />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The code
        </h2>
        <CodeBlock
          className="mt-4"
          filename="app/composition/page.tsx"
          code={`// INNER — a shared data function (or wrapped fetch)
async function getInnerData() {
  'use cache'
  cacheLife('hours')
  cacheTag('composition-inner')
  return getExpensiveData()
}

// OUTER — the whole page embeds the inner result
export default async function Page() {
  'use cache'
  cacheLife('hours')
  cacheTag('composition-page')

  const outer = await getExpensiveData()
  const inner = await getInnerData() // nested cache
  return <Report outer={outer} inner={inner} />
}`}
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-card-foreground">
          Invalidating only the inner tag
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Because the page&apos;s cached output <em>contains</em> the inner
          result, the outer entry inherits the inner&apos;s tags. So{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            revalidateTag(&apos;composition-inner&apos;)
          </code>{' '}
          purges <span className="text-card-foreground">both</span> entries. The
          next request re-runs the page body, which re-runs the inner cache —
          you never end up with a stale page wrapping fresh inner data.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Try both tags from the{' '}
          <Link
            href="/webhook"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Webhook invalidation
          </Link>{' '}
          example and watch the order of the log lines.
        </p>
      </section>
    </div>
  )
}
