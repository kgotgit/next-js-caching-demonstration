import { Suspense } from 'react'
import { connection } from 'next/server'
import { cacheLife } from 'next/cache'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { ReadingCardSkeleton } from '@/components/reading-card'
import { CodeBlock } from '@/components/code-block'
import { ReloadButton } from '@/components/reload-button'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/demo'

const ENDPOINT = 'https://api.vercel.app/blog'

type Post = { id: number; title: string; author: string; category: string }

type FetchResult = {
  posts: Post[]
  fetchedAt: string
  ok: boolean
}

// The fetch lives inside a 'use cache' function, so its response is memoized.
// Subsequent calls return the stored response instead of hitting the network.
async function getCachedPosts(): Promise<FetchResult> {
  'use cache'
  cacheLife('minutes')
  // Only logs on a MISS (when the upstream fetch actually happens). No new log
  // on refresh = the cached response was served without touching the network.
  console.log(`[v0] fetch-level CACHED 'use cache' — UPSTREAM FETCH at ${new Date().toISOString()}`)
  return runFetch()
}

// Identical fetch, but uncached: connection() defers it to request time so it
// re-hits the network on every request.
async function getLivePosts(): Promise<FetchResult> {
  await connection()
  // Logs on EVERY request — there is no cache to skip the work.
  console.log(`[v0] fetch-level LIVE (uncached) — UPSTREAM FETCH at ${new Date().toISOString()}`)
  return runFetch()
}

async function runFetch(): Promise<FetchResult> {
  try {
    const res = await fetch(ENDPOINT)
    const data: Post[] = await res.json()
    return { posts: data.slice(0, 3), fetchedAt: new Date().toISOString(), ok: true }
  } catch {
    return {
      posts: [
        { id: 0, title: 'Offline sample post', author: 'System', category: 'Fallback' },
      ],
      fetchedAt: new Date().toISOString(),
      ok: false,
    }
  }
}

function FetchPanel({
  result,
  variant,
}: {
  result: FetchResult
  variant: 'cached' | 'live'
}) {
  const isCached = variant === 'cached'
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5',
        isCached ? 'border-cached/40' : 'border-live/50',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-card-foreground">
          {isCached ? 'Cached fetch' : 'Live fetch'}
        </h3>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
            isCached ? 'bg-cached/10 text-cached' : 'bg-live/15 text-live-foreground',
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              isCached ? 'bg-cached' : 'animate-pulse bg-live',
            )}
            aria-hidden
          />
          {isCached ? 'CACHED' : 'LIVE'}
        </span>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">Fetched at</p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-card-foreground">
        {formatTime(result.fetchedAt)}
      </p>

      <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
        {result.posts.map((post) => (
          <li key={post.id} className="text-sm">
            <span className="font-medium text-card-foreground">
              {post.title}
            </span>
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {post.category}
            </span>
          </li>
        ))}
      </ul>
      {!result.ok ? (
        <p className="mt-3 text-xs text-live-foreground">
          Network unavailable — showing fallback data.
        </p>
      ) : null}
    </div>
  )
}

async function CachedFetch() {
  const result = await getCachedPosts()
  return <FetchPanel result={result} variant="cached" />
}

async function LiveFetch() {
  const result = await getLivePosts()
  return <FetchPanel result={result} variant="live" />
}

export default function FetchLevelDemo() {
  return (
    <div className="flex flex-col gap-10">
      <DemoHeader
        directive="'use cache' · around fetch()"
        title="Fetch-level caching"
        description="Wrapping a network call in a 'use cache' function memoizes the response. The same request is served from cache instead of re-hitting your upstream API on every request — protecting it from load."
        timing="Build time + runtime (in-memory)"
        storage="In-memory LRU (keyed by the function + args)"
      >
        <ObserveHint
          items={[
            'Both panels fetch the same endpoint, but only one is wrapped in use cache.',
            'The cached "Fetched at" time freezes; the live one updates every refresh.',
            'In production this means N visitors trigger at most one upstream request per cache window.',
          ]}
        />
      </DemoHeader>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Same endpoint, two strategies
          </h2>
          <ReloadButton />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Suspense fallback={<ReadingCardSkeleton title="Cached fetch" />}>
            <CachedFetch />
          </Suspense>
          <Suspense fallback={<ReadingCardSkeleton title="Live fetch" />}>
            <LiveFetch />
          </Suspense>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The code
        </h2>
        <CodeBlock
          className="mt-4"
          filename="app/fetch-level/page.tsx"
          code={`async function getCachedPosts() {
  'use cache'
  cacheLife('minutes')

  const res = await fetch('https://api.vercel.app/blog')
  return res.json() // response memoized per cache key
}`}
        />
      </section>
    </div>
  )
}
