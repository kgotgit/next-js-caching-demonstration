import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'
import { expensiveWork, type Reading } from '@/lib/demo'
import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { ReadingCard, ReadingCardSkeleton } from '@/components/reading-card'
import { CodeBlock } from '@/components/code-block'
import { ReloadButton } from '@/components/reload-button'
import { cn } from '@/lib/utils'

const CURRENCIES = ['USD', 'EUR', 'GBP'] as const
const BASE_PRICE = 49

// 'use cache: remote' stores the result in a durable, shared remote cache
// handler instead of per-instance memory. It CANNOT read cookies directly —
// the currency is extracted at request time and passed in as an argument, so
// the cache key is (productId, currency). All users with the same currency
// share one entry across every server instance.
async function getProductPrice(
  productId: string,
  currency: string,
): Promise<{ price: string; reading: Reading }> {
  'use cache: remote'
  cacheTag(`price-${productId}-${currency}`)
  cacheLife({ stale: 60, revalidate: 120, expire: 600 })

  const rates: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79 }
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' }
  const value = (BASE_PRICE * (rates[currency] ?? 1)).toFixed(2)

  const reading = await expensiveWork(`Remote price · ${currency}`, 700)
  return { price: `${symbols[currency] ?? ''}${value}`, reading }
}

// Server Action: change the currency cookie. Reading this cookie defers the
// price component to request time, which is exactly when remote caching helps.
async function setCurrency(formData: FormData) {
  'use server'
  const next = String(formData.get('currency') ?? 'USD')
  ;(await cookies()).set('currency', next)
}

async function PriceForCurrency() {
  // Reading the cookie opts this component out of the static shell.
  const currency = (await cookies()).get('currency')?.value ?? 'USD'
  const { price, reading } = await getProductPrice('widget-pro', currency)

  return (
    <div className="rounded-xl border border-cached/40 bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-card-foreground">
          Widget Pro — price in {currency}
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cached/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-cached">
          <span className="size-1.5 rounded-full bg-cached" aria-hidden />
          REMOTE
        </span>
      </div>
      <p className="mt-4 font-mono text-4xl font-semibold text-card-foreground">
        {price}
      </p>
      <p className="mt-4 font-mono text-xs text-muted-foreground">
        Cached at {new Date(reading.generatedAt).toLocaleTimeString('en-US', {
          hour12: false,
        })}{' '}
        · token {reading.token}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Frozen per currency. Switch currencies to populate separate entries;
        switch back and the original entry returns unchanged.
      </p>
    </div>
  )
}

export default function RemoteDemo() {
  return (
    <div className="flex flex-col gap-10">
      <DemoHeader
        directive="'use cache: remote'"
        title="Remote (shared) caching"
        description="When a component is deferred to request time (e.g. it reads a cookie), in-memory caching barely helps because serverless instances don't share memory. 'use cache: remote' stores the result in a durable handler shared across all instances — ideal for protecting rate-limited or slow backends."
        timing="Request time"
        storage="Remote cache handler (shared across instances)"
      >
        <ObserveHint
          items={[
            'The price is keyed by currency, not by user — everyone on USD shares one entry.',
            'Switch currency, then switch back: the original entry is reused (same token).',
            'Refresh within the window: served from the remote cache, no recompute.',
          ]}
        />
      </DemoHeader>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Currency
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {CURRENCIES.map((c) => (
                <form key={c} action={setCurrency}>
                  <input type="hidden" name="currency" value={c} />
                  <button
                    type="submit"
                    className={cn(
                      'rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted',
                    )}
                  >
                    {c}
                  </button>
                </form>
              ))}
            </div>
            <ReloadButton />
          </div>
        </div>
        <Suspense fallback={<ReadingCardSkeleton title="Widget Pro price" />}>
          <PriceForCurrency />
        </Suspense>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The code
        </h2>
        <CodeBlock
          className="mt-4"
          filename="app/remote/page.tsx"
          code={`async function PriceForCurrency() {
  // reading the cookie defers this to request time
  const currency = (await cookies()).get('currency')?.value ?? 'USD'
  return <Price {...await getProductPrice('widget-pro', currency)} />
}

async function getProductPrice(productId, currency) {
  'use cache: remote'           // durable, shared across instances
  cacheTag(\`price-\${productId}-\${currency}\`)
  cacheLife({ revalidate: 120 })
  return db.products.getPrice(productId, currency)
}`}
        />
      </section>
    </div>
  )
}
