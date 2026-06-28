import Link from 'next/link'
import { demoRoutes } from '@/lib/routes'
import { CodeBlock } from '@/components/code-block'

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
