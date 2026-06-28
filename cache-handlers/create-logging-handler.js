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

// Set CACHE_LOG_ENTRIES=0 to silence the verbose entry/value dumps and keep
// only the HIT/MISS/WRITE/INVALIDATE one-liners.
const LOG_ENTRIES = process.env.CACHE_LOG_ENTRIES !== '0'

// How much of the cached value stream to read for the preview. We never read
// more than this so logging stays cheap even for large pages.
const PREVIEW_CHARS = 600
const READ_CAP_BYTES = 16 * 1024

// Keep keys readable in the logs — they can be very long internal hashes.
function shorten(key) {
  if (typeof key !== 'string') return String(key)
  return key.length > 56 ? `${key.slice(0, 56)}…` : key
}

function now() {
  return new Date().toISOString()
}

function fmtDuration(seconds) {
  if (seconds == null) return '?'
  if (!Number.isFinite(seconds)) return '∞'
  return `${seconds}s`
}

// Log the entry's metadata (cheap, synchronous) — tags, lifetimes, age.
function logEntryMeta(label, op, cacheKey, entry) {
  if (!LOG_ENTRIES || !entry) return
  const tags = Array.isArray(entry.tags) ? entry.tags.join(', ') : ''
  const created =
    typeof entry.timestamp === 'number'
      ? new Date(entry.timestamp).toISOString()
      : '?'
  console.log(
    `[v0] cacheHandler:${label} — L2 ENTRY (${op}) key=${shorten(cacheKey)}\n` +
      `        tags=[${tags}] created=${created} ` +
      `stale=${fmtDuration(entry.stale)} ` +
      `revalidate=${fmtDuration(entry.revalidate)} ` +
      `expire=${fmtDuration(entry.expire)}`,
  )
}

// Read a capped preview of the (tee'd) value stream WITHOUT blocking the real
// consumer. `peek` is one branch of a tee, so draining/cancelling it is safe.
async function logEntryValue(label, op, cacheKey, peek) {
  if (!LOG_ENTRIES || !peek) return
  try {
    const reader = peek.getReader()
    const decoder = new TextDecoder()
    let preview = ''
    let bytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (preview.length < PREVIEW_CHARS) {
        preview += decoder.decode(value, { stream: true })
      }
      if (bytes >= READ_CAP_BYTES) {
        await reader.cancel()
        break
      }
    }
    const truncated = preview.length > PREVIEW_CHARS || bytes >= READ_CAP_BYTES
    const snippet = preview.slice(0, PREVIEW_CHARS)
    console.log(
      `[v0] cacheHandler:${label} — L2 VALUE (${op}) key=${shorten(cacheKey)} ` +
        `~${bytes} bytes (RSC/Flight payload)\n` +
        `        ${JSON.stringify(snippet)}${truncated ? ' …(truncated)' : ''}`,
    )
  } catch (err) {
    console.log(
      `[v0] cacheHandler:${label} — L2 VALUE (${op}) key=${shorten(cacheKey)} ` +
        `(could not read preview: ${err && err.message})`,
    )
  }
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
      if (entry) {
        logEntryMeta(label, 'HIT', cacheKey, entry)
        // Tee so we can preview the value while the real consumer still gets
        // a complete, independent copy of the stream.
        if (entry.value && typeof entry.value.tee === 'function') {
          const [pass, peek] = entry.value.tee()
          entry.value = pass
          void logEntryValue(label, 'HIT', cacheKey, peek)
        }
      }
      return entry
    },

    async set(cacheKey, pendingEntry) {
      console.log(
        `[v0] cacheHandler:${label} — L2 WRITE key=${shorten(cacheKey)} at ${now()}`,
      )
      // The entry may still be pending (value stream still being written), so
      // we attach our preview to the resolved entry and hand a tee'd copy to
      // the base handler — never blocking on the full stream here.
      const passEntry = pendingEntry.then((entry) => {
        if (!entry) return entry
        logEntryMeta(label, 'WRITE', cacheKey, entry)
        if (entry.value && typeof entry.value.tee === 'function') {
          const [pass, peek] = entry.value.tee()
          void logEntryValue(label, 'WRITE', cacheKey, peek)
          return { ...entry, value: pass }
        }
        return entry
      })
      return base.set(cacheKey, passEntry)
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
