'use cache'

import { cacheLife } from 'next/cache'
import { expensiveWork } from '@/lib/demo'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
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

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-card-foreground">
          Can this be ISR instead of build time?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Yes. A plain non-dynamic route like this one is{' '}
          <span className="text-card-foreground">always</span> prerendered at
          build time when it is fully cacheable — there is no parameter to defer.
          To generate the page <span className="text-card-foreground">on first
          request</span> instead, make it a dynamic route and have{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            generateStaticParams
          </code>{' '}
          return only a subset of params. Unlisted URLs are not built — Next.js
          serves a generic App Shell on the first visit, renders the real page in
          the background, caches it, then serves the cached version. That is the
          Cache Components equivalent of ISR / <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">fallback: true</code>.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Link
            href="/page-level/alpha"
            className="rounded-lg border border-cached/40 bg-cached/5 p-4 transition-colors hover:border-cached"
          >
            <span className="inline-block rounded-full bg-cached/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-cached">
              prebuilt
            </span>
            <p className="mt-2 font-mono text-sm text-card-foreground">/alpha</p>
            <p className="mt-1 text-xs text-muted-foreground">
              In generateStaticParams — rendered at build, instant from visit #1.
            </p>
          </Link>
          {['beta', 'gamma'].map((s) => (
            <Link
              key={s}
              href={`/page-level/${s}`}
              className="rounded-lg border border-live/40 bg-live/5 p-4 transition-colors hover:border-live"
            >
              <span className="inline-block rounded-full bg-live/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-live-foreground">
                ISR
              </span>
              <p className="mt-2 font-mono text-sm text-card-foreground">/{s}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Not built — generated on first request, then cached.
              </p>
            </Link>
          ))}
        </div>

        <h3 className="mt-6 text-sm font-semibold text-card-foreground">
          Consequences of skipping the build-time shell
        </h3>
        <ul className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="text-card-foreground">First-visit cost:</span> the
            very first visitor to an un-prebuilt URL pays the render/data latency.
            They see the App Shell (a Suspense fallback) immediately while content
            streams in, rather than a fully-formed page.
          </li>
          <li>
            <span className="text-card-foreground">Params must be deferred:</span>{' '}
            you must read <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">params</code>{' '}
            inside a <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">&lt;Suspense&gt;</code>{' '}
            boundary so a generic shell can exist for unknown values. Awaiting them
            at the top level forces the whole route dynamic.
          </li>
          <li>
            <span className="text-card-foreground">Cached data only:</span> work
            wrapped in <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">&apos;use cache&apos;</code>{' '}
            can be promoted into the cached page. Uncached/runtime data keeps
            streaming per request.
          </li>
          <li>
            <span className="text-card-foreground">Cold caches & scale:</span>{' '}
            after a deploy or eviction the entry is cold again, so the next visitor
            re-triggers generation. Great for large/long-tail param spaces you
            can&apos;t afford to build up front; full build-time prerender is better
            when you want a guaranteed-fast first byte for every known URL.
          </li>
        </ul>
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
