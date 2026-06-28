import { Suspense } from 'react'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { expensiveWork } from '@/lib/demo'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { ReadingCard, ReadingCardSkeleton } from '@/components/reading-card'
import { CodeBlock } from '@/components/code-block'
import { ReloadButton } from '@/components/reload-button'

// Slugs we choose to prerender AT BUILD TIME. Everything else is generated
// ON FIRST REQUEST (ISR / fallback) and then cached.
export const PREBUILT_SLUGS = ['alpha'] as const
const ALL_SLUGS = ['alpha', 'beta', 'gamma'] as const

// generateStaticParams returns ONLY the subset we want built ahead of time.
// Because we don't list 'beta'/'gamma', Next.js does not prerender them during
// the build — it serves the App Shell on first visit, renders in the
// background, caches the result, and serves the cached page thereafter.
export function generateStaticParams() {
  return PREBUILT_SLUGS.map((slug) => ({ slug }))
}

// The cached data function. The body only runs on a cache MISS: at build time
// for prebuilt slugs, or on the first request for ISR slugs. After that the
// result is frozen until `cacheLife` revalidates it.
async function getReadingFor(slug: string) {
  'use cache'
  cacheLife({ stale: 12 * 3600, revalidate: 6 * 3600, expire: 24 * 3600 })
  cacheTag(`dynamic-isr-${slug}`)
  console.log(
    `[v0] dynamic-isr '${slug}' — function BODY EXECUTED at ${new Date().toISOString()}`,
  )
  return expensiveWork(`Dynamic ISR · ${slug}`, 700)
}

// Everything slug-specific lives here, and this whole subtree is rendered INSIDE
// a <Suspense> boundary. Awaiting `params` here (not at the top of the page)
// is what lets Next.js prerender a generic App Shell for slugs it never built:
// the await suspends, the fallback ships in the static shell, and the real
// content streams in once the slug is known.
async function SlugView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const reading = await getReadingFor(slug)
  const prebuilt = (PREBUILT_SLUGS as readonly string[]).includes(slug)

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {ALL_SLUGS.map((s) => {
          const active = s === slug
          const isPrebuilt = (PREBUILT_SLUGS as readonly string[]).includes(s)
          return (
            <Link
              key={s}
              href={`/dynamic-isr/${s}`}
              className={
                active
                  ? 'inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                  : 'inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-card-foreground transition-colors hover:border-primary/50'
              }
            >
              {s}
              <span
                className={
                  isPrebuilt
                    ? 'rounded-full bg-cached/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-cached'
                    : 'rounded-full bg-live/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-live-foreground'
                }
              >
                {isPrebuilt ? 'prebuilt' : 'ISR'}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Cached output for &quot;{slug}&quot;
        </h2>
        <ReloadButton />
      </div>

      <ReadingCard
        variant="cached"
        title={
          prebuilt
            ? `"${slug}" — prerendered at build`
            : `"${slug}" — generated on first request`
        }
        reading={reading}
        note={
          prebuilt
            ? 'This slug was in generateStaticParams, so it was rendered during the build and served instantly from the very first visit.'
            : 'This slug was NOT prebuilt. The first visitor got the App Shell (the skeleton) while this rendered in the background; it is now cached, so refreshes are instant until cacheLife revalidates.'
        }
      />
    </>
  )
}

// Skeleton App Shell shown while the slug content streams in (and shipped as the
// prerendered shell for un-prebuilt slugs).
function SlugViewFallback() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {ALL_SLUGS.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Cached output
        </h2>
      </div>
      <ReadingCardSkeleton title="Generating…" />
    </>
  )
}

// NOTE: the page component itself does NOT await `params`. It only forwards the
// promise into <Suspense>, keeping the route's shell fully prerenderable.
export default function PageLevelISRDemo({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <div className="flex flex-col gap-10">
      <DemoHeader
        directive="'use cache' + generateStaticParams"
        title="ISR page"
        description="A dynamic route that prebuilds only a subset of slugs. Unlisted slugs are not generated at build — they are rendered on first request, cached, and revalidated on a timer. This is the Cache Components equivalent of ISR / fallback: true."
        timing="Build time (prebuilt slugs) + first request (the rest)"
        storage="Static shell + per-slug cache entry"
      >
        <ObserveHint
          items={[
            'Only "alpha" is prebuilt. Visit "beta" or "gamma" to trigger on-demand generation.',
            'On the very first visit to a new slug you briefly see the streaming skeleton (the App Shell). After that the slug is cached.',
            'Watch the server logs: a "[v0] dynamic-isr" line prints the first time each slug is generated, then stays silent on refresh.',
          ]}
        />
      </DemoHeader>

      <section className="flex flex-col gap-4">
        <Suspense fallback={<SlugViewFallback />}>
          <SlugView params={params} />
        </Suspense>
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
  cacheLife('minutes')        // revalidate window (ISR timer)
  cacheTag(\`page-level-\${slug}\`) // for on-demand updateTag()
  return getExpensiveData(slug)
}

// All slug-specific work awaits params INSIDE <Suspense>, so Next can
// ship a generic App Shell for slugs it never prerendered.
async function SlugView({ params }) {
  const { slug } = await params
  return <ReadingCard reading={await getReadingFor(slug)} />
}

// The page itself never awaits params ��� it just forwards the promise.
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
