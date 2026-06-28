import Link from 'next/link'
import { demoRoutes } from '@/lib/routes'
import { CodeBlock } from '@/components/code-block'
import { TIER_META, TIER_ORDER, type TierId } from '@/lib/cache-tiers'

// Extra, overview-only detail layered on top of the shared TIER_META so the
// per-example strip and this explainer stay in sync but read differently.
const tierDetail: Record<
  TierId,
  {
    accent: string
    survivesTeardown: string
    survivesDeploy: string
    directive: string
  }
> = {
  L0: {
    accent: 'border-l-primary',
    survivesTeardown: 'Yes — never touches the function',
    survivesDeploy: 'Rebuilt each deploy',
    directive: 'Fully static / prerendered routes',
  },
  L1: {
    accent: 'border-l-live',
    survivesTeardown: 'No — dies with the instance',
    survivesDeploy: 'No',
    directive: "'use cache' (warm path)",
  },
  L2: {
    accent: 'border-l-cached',
    survivesTeardown: 'Yes — shared durable store',
    survivesDeploy: 'No by default (custom handler can)',
    directive: "'use cache' + 'use cache: remote'",
  },
  private: {
    accent: 'border-l-muted-foreground',
    survivesTeardown: 'N/A — lives in the browser',
    survivesDeploy: 'N/A',
    directive: "'use cache: private'",
  },
}

const scopes = [
  {
    level: 'File level',
    summary:
      'Directive at the very top of the file caches the whole module — the entire page or layout — as one unit with a single key.',
    example: 'Page-level demo',
    href: '/page-level',
    code: `'use cache'

export default async function Page() {
  // the whole page is one cached unit
  return <Report />
}`,
  },
  {
    level: 'Component level',
    summary:
      'Directive inside a component caches just that subtree, so it can be reused across pages while the rest stays dynamic.',
    example: 'Function-level demo',
    href: '/function-level',
    code: `export async function Sidebar() {
  'use cache'
  // only this component is cached
  return <Nav items={await getNav()} />
}`,
  },
  {
    level: 'Function level',
    summary:
      'Directive inside an async function caches only that data call. Finest grain — one entry shared by every caller with the same args.',
    example: 'Function-level demo',
    href: '/function-level',
    code: `async function getData() {
  'use cache'
  // only the return value is cached
  return db.query(...)
}`,
  },
]

const storage = [
  {
    feature: 'Artifacts produced',
    build: 'HTML shell + RSC payload',
    isr: 'Identical HTML + RSC payload',
  },
  {
    feature: 'When first generated',
    build: 'At next build',
    isr: 'On the first request to the URL',
  },
  {
    feature: 'Where it is stored',
    build: 'Build output → lifted to CDN (L0)',
    isr: 'Durable store (L2), then served via CDN',
  },
  {
    feature: 'Survives function teardown',
    build: 'Yes — it is static',
    isr: 'Yes — that is the point of L2',
  },
  {
    feature: 'Survives a new deploy',
    build: 'Rebuilt every deploy',
    isr: 'Regenerated on first hit per deploy',
  },
]

const comparison = [
  {
    feature: 'Server-side storage',
    cache: 'In-memory (or handler)',
    remote: 'Remote handler',
    priv: 'None',
  },
  {
    feature: 'Cache scope',
    cache: 'All users',
    remote: 'All users',
    priv: 'Per browser',
  },
  {
    feature: 'Read cookies / headers',
    cache: 'No — pass as args',
    remote: 'No — pass as args',
    priv: 'Yes',
  },
  {
    feature: 'Goal',
    cache: 'Static shell',
    remote: 'Shared runtime cache',
    priv: 'Compliance / personal',
  },
  {
    feature: 'Extra cost',
    cache: 'None',
    remote: 'Infra + latency',
    priv: 'None',
  },
]

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-10">
      <header>
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
          cacheComponents: true
        </span>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground">
          Understanding Cache Components
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Cache Components introduce explicit, composable caching in Next.js via
          the <code className="font-mono text-foreground">use cache</code>{' '}
          family of directives. Each demo below isolates one behavior so you can
          watch exactly what freezes, what stays live, and when work re-runs.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The mental model
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Every value on a page is one of three things. A cached value freezes
          until it revalidates. A live value runs on every request and streams
          in behind a{' '}
          <code className="font-mono text-foreground">Suspense</code> boundary.
          Static, deterministic output is folded into the prerendered shell at
          build time. Each card in these demos is tagged{' '}
          <span className="font-semibold text-cached">CACHED</span> or{' '}
          <span className="font-semibold text-live-foreground">LIVE</span> so
          the distinction is always visible.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Where caches live: L0, L1, L2 &amp; Private
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          A cached value can be served from one of four tiers. On every request
          Next.js checks them in order — closest to the user first — and the
          first tier holding a fresh entry wins. Each example highlights which
          tiers it actually uses; here is what each one means.
        </p>
        <ol className="mt-5 flex flex-col gap-4">
          {TIER_ORDER.map((id, index) => {
            const meta = TIER_META[id]
            const detail = tierDetail[id]
            return (
              <li
                key={id}
                className={`rounded-xl border border-border border-l-4 bg-card p-5 ${detail.accent}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold text-foreground">
                    {index}
                  </span>
                  <h3 className="font-mono text-sm font-semibold text-card-foreground">
                    {meta.name}
                  </h3>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {meta.where}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {meta.desc}
                </p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Survives function teardown
                    </dt>
                    <dd className="mt-1 text-card-foreground">
                      {detail.survivesTeardown}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Survives new deploy
                    </dt>
                    <dd className="mt-1 text-card-foreground">
                      {detail.survivesDeploy}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Typical directive
                    </dt>
                    <dd className="mt-1 font-mono text-xs text-card-foreground">
                      {detail.directive}
                    </dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The big takeaway:{' '}
          <span className="text-foreground">L1 is per-instance and ephemeral</span>
          , while <span className="text-foreground">L2 is durable</span> and is
          what lets ISR entries survive a serverless function shutting down.
          Private never leaves the user&apos;s browser, so it is never shared or
          stored on the server.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          How the shell is stored: build time vs ISR
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          Prerendering a route produces two static artifacts — the{' '}
          <span className="text-foreground">HTML shell</span> and the{' '}
          <span className="text-foreground">RSC payload</span> (the serialized
          React Server Component output). They are packaged in the same immutable
          deployment bundle as your function code, but they are not{' '}
          <em>inside</em> the function: at serve time the static shell is lifted
          to the edge (L0) while the function runs separately only when something
          dynamic needs to render. That separation is what lets the edge answer a
          request while the function stays cold.
        </p>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          ISR uses the <span className="text-foreground">exact same mechanism</span>
          {' '}— it just creates that artifact lazily on the first request instead
          of at build, and persists it into the durable L2 store rather than
          baking it into the build bundle. After the first generation, an ISR
          entry and a build-time entry are served identically.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Aspect
                </th>
                <th className="px-4 py-3 font-semibold text-foreground">
                  Build-time prerender
                </th>
                <th className="px-4 py-3 font-semibold text-foreground">
                  ISR / on-demand
                </th>
              </tr>
            </thead>
            <tbody>
              {storage.map((row) => (
                <tr
                  key={row.feature}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {row.feature}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.build}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.isr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Shortcut to remember:{' '}
          <span className="text-foreground">
            build time writes the file during <code className="font-mono">next build</code>{' '}
            and ships it in the bundle
          </span>
          ;{' '}
          <span className="text-foreground">
            ISR writes the same file on first request and stores it in L2
          </span>
          . Both then sit in front of a function that only re-runs on expiry, tag
          invalidation, or a redeploy. See it live in the{' '}
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
          Caching scopes: file, component &amp; function level
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          The same <code className="font-mono text-foreground">use cache</code>{' '}
          directive works at three grains, depending on where you place it. The
          broadest is the whole file; the finest is a single data function.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {scopes.map((scope) => (
            <div
              key={scope.level}
              className="flex flex-col rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-medium text-card-foreground">{scope.level}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {scope.summary}
              </p>
              <div className="mt-4">
                <CodeBlock code={scope.code} />
              </div>
              <Link
                href={scope.href}
                className="mt-4 font-mono text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                {scope.example} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The three directives
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Feature
                </th>
                <th className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                  use cache
                </th>
                <th className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                  use cache: remote
                </th>
                <th className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                  use cache: private
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr
                  key={row.feature}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {row.feature}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.cache}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.remote}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.priv}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Enable it
        </h2>
        <CodeBlock
          className="mt-4"
          filename="next.config.mjs"
          code={`/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
}

export default nextConfig`}
        />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Explore the demos
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {demoRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <span className="font-mono text-xs font-semibold text-primary">
                {route.directive}
              </span>
              <h3 className="mt-2 font-medium text-card-foreground">
                {route.label}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {route.blurb}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
