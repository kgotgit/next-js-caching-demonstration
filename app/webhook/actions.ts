'use server'

import { invalidateTag, type InvalidateMode } from '@/lib/revalidate'

// In-app wrapper around the same invalidation logic the webhook uses. This lets
// the demo buttons trigger the exact same log flow without needing the secret,
// while /api/revalidate stays the real, secret-protected webhook for external
// callers. Both paths call invalidateTag(), so the logs are identical.
export async function triggerInvalidate(tag: string, mode: InvalidateMode) {
  invalidateTag(tag, mode)
  return { ok: true, tag, mode, at: new Date().toISOString() }
}
