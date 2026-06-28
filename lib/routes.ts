export type DemoRoute = {
  href: string
  label: string
  directive: string
  blurb: string
}

export const demoRoutes: DemoRoute[] = [
  {
    href: '/page-level',
    label: 'Page-level cache',
    directive: "'use cache'",
    blurb: 'Cache an entire route into the static shell at build time.',
  },
  {
    href: '/dynamic-isr',
    label: 'Dynamic ISR',
    directive: "'use cache' + params",
    blurb: 'Generate a route on first request, then cache it (ISR / fallback).',
  },
  {
    href: '/function-level',
    label: 'Function-level cache',
    directive: "'use cache'",
    blurb: 'Cache a single async data function, reused across components.',
  },
  {
    href: '/fetch-level',
    label: 'Fetch-level cache',
    directive: "'use cache'",
    blurb: 'Wrap a fetch() so the network response is memoized.',
  },
  {
    href: '/isr',
    label: 'ISR / revalidation',
    directive: 'cacheLife + cacheTag',
    blurb: 'Time-based and on-demand revalidation (ISR-style).',
  },
  {
    href: '/remote',
    label: 'Remote cache',
    directive: "'use cache: remote'",
    blurb: 'Durable, shared cache across instances at request time.',
  },
  {
    href: '/private',
    label: 'Private cache',
    directive: "'use cache: private'",
    blurb: 'Per-user cache that may read cookies and headers.',
  },
  {
    href: '/composition',
    label: 'Composition (nesting)',
    directive: "nested 'use cache'",
    blurb: 'Nest caches and watch inner-tag invalidation bubble up to the page.',
  },
  {
    href: '/webhook',
    label: 'Webhook invalidation',
    directive: 'revalidateTag',
    blurb: 'Invalidate cache tags on demand via a webhook and trace the logs.',
  },
]
