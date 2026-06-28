import Link from 'next/link'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { CacheTiers } from '@/components/cache-tiers'
import { CodeBlock } from '@/components/code-block'

// This landing page itself is fully static — it reads no runtime data, so it is
// prerendered into the shell at build time. The ISR behavior lives in the
// dynamic child route, app/dynamic-isr/[slug].

export default function DynamicIsrDemo() {
  return (
    <div className="flex flex-col gap-10">
      <DemoHeader
        directive="'use cache' + generateStaticParams"
        title="Dynamic ISR (generate on first request)"
        description="A plain route is always prerendered at build when fully cacheable. To generate a page on first request instead — the Cache Components equivalent of ISR / fallback: true — use a dynamic route whose generateStaticParams returns only a subset of params."
        timing="Build time (prebuilt slugs) + first request (the rest)"
        storage="Static App Shell + per-slug cache entry"
      >
        <CacheTiers
          tiers={{
            L0: {
              status: 'primary',
              note: 'Prebuilt slugs and the generic App Shell are served from the edge.',
            },
            L1: {
              status: 'used',
              note: 'A freshly generated slug warms in memory for that instance.',
            },
            L2: {
              status: 'primary',
              note: 'On-demand slug entries persist in the durable store, so they survive teardown — watch cacheHandler:default WRITE on first visit.',
            },
          }}
        />
        <ObserveHint
          items={[
            'Only "alpha" is prebuilt at build time. "beta" and "gamma" are generated on first visit, then cached.',
            'On the first visit to a new slug you briefly see the streaming skeleton (the App Shell); refreshes after that are instant.',
            'Watch the server logs: a "[v0] dynamic-isr" line prints the first time each slug is generated, then stays silent.',
          ]}
        />
      </DemoHeader>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Try each slug
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/dynamic-isr/alpha"
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
              href={`/dynamic-isr/${s}`}
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
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-card-foreground">
          Consequences of skipping the build-time shell
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="text-card-foreground">First-visit cost:</span> the
            very first visitor to an un-prebuilt URL pays the render/data latency.
            They see the App Shell (a Suspense fallback) immediately while content
            streams in, rather than a fully-formed page.
          </li>
          <li>
            <span className="text-card-foreground">Params must be deferred:</span>{' '}
            you must read{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              params
            </code>{' '}
            inside a{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              &lt;Suspense&gt;
            </code>{' '}
            boundary so a generic shell can exist for unknown values. Awaiting
            them at the top level forces the whole route dynamic.
          </li>
          <li>
            <span className="text-card-foreground">Cached data only:</span> work
            wrapped in{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              &apos;use cache&apos;
            </code>{' '}
            can be promoted into the cached page. Uncached/runtime data keeps
            streaming per request.
          </li>
          <li>
            <span className="text-card-foreground">Cold caches &amp; scale:</span>{' '}
            after a deploy or eviction the entry is cold again, so the next
            visitor re-triggers generation. Great for large/long-tail param spaces
            you can&apos;t afford to build up front; full build-time prerender is
            better when you want a guaranteed-fast first byte for every known URL.
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-cached/30 bg-cached/5 p-6">
        <h2 className="text-base font-semibold text-card-foreground">
          Does the cache survive the serverless function shutting down?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="text-card-foreground">Yes — within the same deployment.</span>{' '}
          Serverless functions are short-lived: they spin up for a request, stay
          warm briefly, then get torn down. But that instance lifecycle is{' '}
          <span className="text-card-foreground">decoupled</span> from the cache
          lifecycle, because an ISR entry is written to two tiers:
        </p>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="text-card-foreground">In-memory (L1):</span> lives
            and dies with the function instance — the fast path while it stays
            warm.
          </li>
          <li>
            <span className="text-card-foreground">Durable store (L2):</span>{' '}
            lives at the deployment level, independent of any instance. It
            persists across every cold start and teardown.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          So when the original instance dies and a fresh cold instance picks up
          the next request, it finds an empty memory cache but reads the entry
          from the durable store and{' '}
          <span className="text-card-foreground">serves it without regenerating</span>.
          The function dying is invisible to the cache — you only pay a slightly
          slower lookup, not a rebuild.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Regeneration happens only when
          </p>
          <p className="mt-2 text-sm leading-relaxed text-card-foreground">
            the <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">cacheLife</code>{' '}
            window expires, a tag is invalidated (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">revalidateTag</code>{' '}
            /{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">updateTag</code>
            ), the entry is evicted, or you ship a new deployment. Function
            teardown is <span className="font-medium">not</span> on that list.
          </p>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Caveat: this is the Vercel (and any external{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            cacheHandler
          </code>
          ) behavior. On a bare single-process self-host with{' '}
          <span className="text-card-foreground">only</span> the in-memory tier,
          losing the process does mean the next request regenerates — the durable
          layer is exactly what prevents that.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The code
        </h2>
        <CodeBlock
          className="mt-4"
          filename="app/dynamic-isr/[slug]/page.tsx"
          code={`// Prebuild ONLY a subset. Unlisted slugs become ISR.
export function generateStaticParams() {
  return [{ slug: 'alpha' }] // 'beta' / 'gamma' are generated on demand
}

async function getReadingFor(slug: string) {
  'use cache'
  cacheLife('minutes')          // revalidate window (ISR timer)
  cacheTag(\`dynamic-isr-\${slug}\`) // for on-demand updateTag()
  return getExpensiveData(slug)
}

// All slug-specific work awaits params INSIDE <Suspense>, so Next can
// ship a generic App Shell for slugs it never prerendered.
async function SlugView({ params }) {
  const { slug } = await params
  return <ReadingCard reading={await getReadingFor(slug)} />
}

// The page itself never awaits params — it just forwards the promise.
export default function Page({ params }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <SlugView params={params} />
    </Suspense>
  )
}`}
        />
      </section>
    </div>
  )
}
