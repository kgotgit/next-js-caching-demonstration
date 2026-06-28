'use cache'

import { cacheLife, cacheTag } from 'next/cache'
import { expensiveWork } from '@/lib/demo'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { CacheTiers } from '@/components/cache-tiers'
import { ReadingCard } from '@/components/reading-card'
import { CodeBlock } from '@/components/code-block'
import { ReloadButton } from '@/components/reload-button'
import { WatchSignals } from '@/components/watch-signals'
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
  // Label the whole-route entry so a webhook can invalidate this build-time
  // page on demand — see /webhook. Even fully static pages can carry a tag.
  cacheTag('page-level')

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
        description="Adding 'use cache' to the top of a page (and layout) caches the entire route. With no runtime (request-time) APIs in play, the page is fully prerendered into the static shell at build time and served instantly."
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

      <WatchSignals
        ui={[
          {
            code: 'token + timestamp',
            detail:
              'Never change on refresh — captured once at build and reused for everyone.',
          },
        ]}
        network={[
          {
            code: 'x-vercel-cache: HIT',
            detail:
              'On the document request. A never-before-served page shows PRERENDER first, then HIT. You should never see MISS here under normal load.',
          },
          {
            code: 'age: <seconds>',
            detail:
              'Climbs on each refresh, confirming the same cached artifact is being reused rather than regenerated.',
          },
        ]}
        logs={[
          {
            code: "(no new 'page-level … BODY EXECUTED')",
            detail:
              'Silence on refresh IS the signal — the static shell was served without running the function.',
          },
          {
            code: 'cacheHandler:default — L2 WRITE',
            detail:
              'Only appears at build or after invalidation, never on a plain refresh.',
          },
        ]}
      />

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-card-foreground">
          What happens if you invalidate this build-time cache?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This page carries a{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            cacheTag(&apos;page-level&apos;)
          </code>
          , so a webhook can invalidate it even though it was prerendered at
          build. Invalidating it does <em>not</em> rebuild your app — it only
          marks the cached entry, and the route is regenerated on demand:
        </p>
        <ol className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] text-foreground">
              1
            </span>
            <span>
              The webhook calls{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                revalidateTag(&apos;page-level&apos;)
              </code>
              , which expires the entry in the durable store (L2) and the edge
              (L0). Your code is untouched.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] text-foreground">
              2
            </span>
            <span>
              On the <span className="text-card-foreground">next request</span>,
              the prebuilt shell can no longer be served as-is, so the function{' '}
              <span className="text-card-foreground">runs again at request time</span>{' '}
              — exactly like an ISR regeneration. You&apos;ll see{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                page-level BODY EXECUTED
              </code>{' '}
              followed by a fresh{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                L2 WRITE
              </code>{' '}
              in the logs.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] text-foreground">
              3
            </span>
            <span>
              The freshly generated entry is cached again and served from the
              edge. The original build-time artifact is{' '}
              <span className="text-card-foreground">not restored</span> — the
              regenerated one replaces it until your next deploy, which rebuilds
              from scratch.
            </span>
          </li>
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Net effect: invalidating a build-time page turns that one entry into an
          on-demand (ISR) regeneration. Try it from the{' '}
          <Link
            href="/webhook"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Webhook invalidation
          </Link>{' '}
          example using the{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            page-level
          </code>{' '}
          tag.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-card-foreground">
          What does &quot;no runtime APIs in play&quot; mean?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A <span className="text-card-foreground">runtime API</span> is anything
          whose value can only be known once a real request arrives — it depends
          on <em>who</em> is asking or <em>when</em>. Because those values do not
          exist at build time, using one forces the page to render per request.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-cached/40 bg-cached/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-cached">
              No runtime APIs → fully prerendered
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Output is identical for everyone, so Next.js renders it once at
              build, freezes the static shell, and serves it from the edge (L0).
              This page is exactly that case.
            </p>
          </div>
          <div className="rounded-lg border border-live/40 bg-live/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-live-foreground">
              Uses a runtime API → deferred to request time
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Output varies per request, so the dynamic part is streamed in at
              request time and the route becomes Partial Prerender (a static
              shell with dynamic holes).
            </p>
          </div>
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          The common runtime APIs
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            'cookies()',
            'headers()',
            'searchParams',
            'connection()',
            'draftMode()',
            'request URL',
          ].map((api) => (
            <code
              key={api}
              className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground"
            >
              {api}
            </code>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          You can see the other side of this line in the{' '}
          <Link
            href="/private"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Private cache
          </Link>{' '}
          and{' '}
          <Link
            href="/remote"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Remote cache
          </Link>{' '}
          demos, which read cookies and are therefore resolved per request.
        </p>
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

import { cacheLife, cacheTag } from 'next/cache'

export default async function PageLevelDemo() {
  cacheLife('days')      // revalidate the whole route once per day
  cacheTag('page-level') // label it so a webhook can invalidate on demand

  const reading = await getExpensiveData()
  return <ReadingCard reading={reading} />
}`}
        />
      </section>
    </div>
  )
}
