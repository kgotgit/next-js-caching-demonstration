import { revalidateTag } from 'next/cache'

export type InvalidateMode = 'swr' | 'immediate'

export function normalizeMode(value: string | null | undefined): InvalidateMode {
  return value === 'immediate' ? 'immediate' : 'swr'
}

// Shared invalidation logic used by BOTH the webhook Route Handler and the
// in-app Server Action, so the log flow is identical no matter how it is
// triggered. Watch these lines line up in the Vercel logs:
//
//   [v0] webhook — INVALIDATE tag='...' ...        (this function)
//   [v0] cacheHandler:default — L2 INVALIDATE ...  (the cache handler)
//   ...next visit...
//   [v0] <page> — REGENERATED / BODY EXECUTED       (the page re-runs)
//   [v0] cacheHandler:default — L2 MISS then WRITE  (fresh entry stored)
export function invalidateTag(tag: string, mode: InvalidateMode = 'swr') {
  const at = new Date().toISOString()

  if (mode === 'immediate') {
    // { expire: 0 } drops the entry now — the next request blocks on fresh data.
    console.log(
      `[v0] webhook — INVALIDATE tag='${tag}' mode=immediate (revalidateTag, { expire: 0 }) at ${at}`,
    )
    revalidateTag(tag, { expire: 0 })
  } else {
    // profile 'max' marks the entry stale — next request serves stale while it
    // refreshes in the background (stale-while-revalidate).
    console.log(
      `[v0] webhook — INVALIDATE tag='${tag}' mode=swr (revalidateTag, profile='max') at ${at}`,
    )
    revalidateTag(tag, 'max')
  }
}
