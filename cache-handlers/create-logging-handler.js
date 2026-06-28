// A logging cache handler for the demo.
//
// Instead of reimplementing the (tricky) stream tee'ing, expiry, and tag logic,
// we WRAP Next.js's real in-memory default handler and only add console.log
// lines around each operation. That keeps behavior identical to the built-in
// cache while letting you watch every L2 operation in the Vercel logs.
//
// In production you would swap the wrapped handler for Redis/DynamoDB/etc. — the
// logging wrapper would stay the same.
const {
  createDefaultCacheHandler,
} = require('next/dist/server/lib/cache-handlers/default')

// Keep keys readable in the logs — they can be very long internal hashes.
function shorten(key) {
  if (typeof key !== 'string') return String(key)
  return key.length > 56 ? `${key.slice(0, 56)}…` : key
}

function now() {
  return new Date().toISOString()
}

// `label` distinguishes the `default` ('use cache') handler from the `remote`
// ('use cache: remote') handler in the logs.
function createLoggingHandler(label, maxSize = 50 * 1024 * 1024) {
  const base = createDefaultCacheHandler(maxSize)

  return {
    async get(cacheKey, softTags) {
      const entry = await base.get(cacheKey, softTags)
      console.log(
        `[v0] cacheHandler:${label} — L2 ${entry ? 'HIT ' : 'MISS'} key=${shorten(cacheKey)} at ${now()}`,
      )
      console.dir(entry, { depth: 1, colors: true })
      return entry
    },

    async set(cacheKey, pendingEntry) {
      console.log(
        `[v0] cacheHandler:${label} — L2 WRITE key=${shorten(cacheKey)} at ${now()}`,
      )
      console.dir(pendingEntry, { depth: 1, colors: true })
      return base.set(cacheKey, pendingEntry)
    },

    async refreshTags() {
      return base.refreshTags()
    },

    async getExpiration(tags) {
      return base.getExpiration(tags)
    },

    async updateTags(tags, durations) {
      console.log(
        `[v0] cacheHandler:${label} — L2 INVALIDATE tags=[${(tags || []).join(', ')}] at ${now()}`,
      )
      return base.updateTags(tags, durations)
    },
  }
}

module.exports = { createLoggingHandler }
