// Registry of every cacheTag used across the demos, so the webhook page can
// offer real, working invalidation targets and explain where each one lives.
export type KnownTag = {
  tag: string
  label: string
  href: string
  pageLabel: string
  // false for the private cache: it lives in the browser, not the server cache
  // handler, so a server-side webhook can never reach it.
  invalidatable: boolean
  note: string
}

export const knownTags: KnownTag[] = [
  {
    tag: 'isr-stat',
    label: 'ISR cached stat',
    href: '/isr',
    pageLabel: 'ISR / revalidation',
    invalidatable: true,
    note: 'Single tagged entry on the ISR page. After invalidation the next visit regenerates it.',
  },
  {
    tag: 'dynamic-isr-beta',
    label: 'Dynamic ISR · beta',
    href: '/dynamic-isr/beta',
    pageLabel: 'Dynamic ISR',
    invalidatable: true,
    note: 'One on-demand slug entry. Visit the slug first to populate it, then invalidate.',
  },
  {
    tag: 'price-widget-pro-USD',
    label: 'Remote price · USD',
    href: '/remote',
    pageLabel: 'Remote cache',
    invalidatable: true,
    note: "Lives in the 'use cache: remote' handler — watch the cacheHandler:remote INVALIDATE line.",
  },
  {
    tag: 'price-widget-pro-EUR',
    label: 'Remote price · EUR',
    href: '/remote',
    pageLabel: 'Remote cache',
    invalidatable: true,
    note: 'A separate remote entry keyed by currency — invalidating USD leaves this one untouched.',
  },
  {
    tag: 'greeting',
    label: 'Private greeting',
    href: '/private',
    pageLabel: 'Private cache',
    invalidatable: false,
    note: "'use cache: private' is stored in the browser, never in the server cache handler — a webhook cannot invalidate it.",
  },
]
