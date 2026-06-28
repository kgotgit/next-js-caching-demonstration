import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'
import { expensiveWork, type Reading } from '@/lib/demo'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { CacheTiers } from '@/components/cache-tiers'
import { ReadingCard, ReadingCardSkeleton } from '@/components/reading-card'
import { CodeBlock } from '@/components/code-block'
import { ReloadButton } from '@/components/reload-button'

const NAMES = ['Ada', 'Linus', 'Grace'] as const

// 'use cache: private' is the only directive that may read cookies/headers
// DIRECTLY inside the cached scope. The result is cached only in the browser's
// memory (never on the server) and does not persist across full page reloads —
// a per-user cache for personalized or compliance-sensitive data.
async function getGreeting(): Promise<{ visitor: string; reading: Reading }> {
  'use cache: private'
  // stale must be >= 30s for client-side runtime prefetching to work.
  cacheLife({ stale: 60 })
  cacheTag('greeting')

  // Note: because this is cached in the BROWSER, this server-side log fires on
  // the initial render/MISS; soft navigations reuse the client entry (no log),
  // while a hard reload re-runs it and logs again.
  console.log(`[v0] private 'use cache: private' — function BODY EXECUTED at ${new Date().toISOString()}`)

  const visitor = (await cookies()).get('visitor')?.value ?? 'guest'
  const reading = await expensiveWork(`Private greeting · ${visitor}`, 600)
  return { visitor, reading }
}

async function setVisitor(formData: FormData) {
  'use server'
  ;(await cookies()).set('visitor', String(formData.get('name') ?? 'guest'))
}

async function Greeting() {
  const { visitor, reading } = await getGreeting()
  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg text-foreground">
        Welcome back,{' '}
        <span className="font-semibold text-primary">{visitor}</span>.
      </p>
      <ReadingCard
        variant="cached"
        title="Private, per-browser value"
        reading={reading}
        note="Cached in your browser's memory only. It stays stable on soft navigations and server round-trips, but a full page reload re-runs it — and another visitor never sees this entry."
      />
    </div>
  )
}

export default function PrivateDemo() {
  return (
    <div className="flex flex-col gap-10">
      <DemoHeader
        directive="'use cache: private'"
        title="Private (per-user) caching"
        description="Use this only when you can't refactor runtime data into arguments, or for compliance reasons. It allows direct cookies()/headers() access inside the cached scope, but the result is stored exclusively in the browser — never on the server."
        timing="Request time (excluded from the static shell)"
        storage="Browser memory only (per client)"
      >
        <CacheTiers
          tiers={{
            L0: {
              status: 'unused',
              note: 'Personalized + cookie-reading, so it is excluded from the edge-served shell.',
            },
            L1: {
              status: 'unused',
              note: 'Never written to server memory — that would leak one user’s data to another.',
            },
            L2: {
              status: 'unused',
              note: "Private entries are never sent to the cacheHandler — you won't see cacheHandler logs here.",
            },
            private: {
              status: 'primary',
              note: "Stored only in this browser's memory; per-user and dropped on a hard reload.",
            },
          }}
        />
        <ObserveHint
          items={[
            'The greeting reads the visitor cookie directly inside the cached function — only the private directive allows this.',
            'Soft refresh (the button) keeps the value stable; a hard browser reload re-runs it, since nothing is stored on the server.',
            'Each browser/user gets its own private entry — never shared.',
          ]}
        />
      </DemoHeader>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Who are you?
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {NAMES.map((name) => (
                <form key={name} action={setVisitor}>
                  <input type="hidden" name="name" value={name} />
                  <button
                    type="submit"
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
                  >
                    {name}
                  </button>
                </form>
              ))}
            </div>
            <ReloadButton />
          </div>
        </div>
        <Suspense
          fallback={<ReadingCardSkeleton title="Private, per-browser value" />}
        >
          <Greeting />
        </Suspense>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The code
        </h2>
        <CodeBlock
          className="mt-4"
          filename="app/private/page.tsx"
          code={`async function getGreeting() {
  'use cache: private'   // cached in the browser only
  cacheLife({ stale: 60 })

  // Allowed here (and ONLY here) to read cookies inside the cache:
  const visitor = (await cookies()).get('visitor')?.value ?? 'guest'
  return { visitor, data: await getPersonalData(visitor) }
}`}
        />
      </section>
    </div>
  )
}
