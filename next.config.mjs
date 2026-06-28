import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables the Cache Components feature, which unlocks the
  // `use cache`, `use cache: remote`, and `use cache: private` directives
  // along with Partial Prerendering (PPR) as the default rendering model.
  cacheComponents: true,

  // Custom cache handlers that wrap Next.js's real in-memory handler and log
  // every L2 operation (HIT / MISS / WRITE / INVALIDATE). This lets you watch
  // the durable tier in the Vercel logs and connect it to the per-page logs.
  // Note: configuring `default` means we now OWN the L2 store — swap the wrapped
  // handler for Redis/etc. in production. `'use cache: private'` is browser-only
  // and is intentionally NOT configurable here.
  cacheHandlers: {
    default: require.resolve('./cache-handlers/default-handler.js'),
    remote: require.resolve('./cache-handlers/remote-handler.js'),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
