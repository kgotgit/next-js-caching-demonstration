// Shared helpers used across the cache demos.
// These simulate "real" work (network calls, DB queries, computation) so the
// effect of caching is observable: when a value is cached, its timestamp and
// random token freeze; when it is live, they change on every request.

export type Reading = {
  /** ISO timestamp captured at the moment the work actually ran. */
  generatedAt: string
  /** A random token captured when the work ran — frozen while cached. */
  token: string
  /** Human label describing where the value came from. */
  source: string
  /** Simulated latency in ms, to make caching wins tangible. */
  latencyMs: number
}

function randomToken() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

/** Pretend to do expensive work (DB query, computation) that takes time. */
export async function expensiveWork(
  source: string,
  latencyMs = 800,
): Promise<Reading> {
  await new Promise((resolve) => setTimeout(resolve, latencyMs))
  return {
    generatedAt: new Date().toISOString(),
    token: randomToken(),
    source,
    latencyMs,
  }
}

/** Format an ISO string into a readable wall-clock time with seconds. */
export function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
