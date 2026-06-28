import type { NextRequest } from 'next/server'
import { invalidateTag, normalizeMode, type InvalidateMode } from '@/lib/revalidate'

// A webhook endpoint a CMS, payment provider, or any external service can call
// to invalidate a cache tag on demand. `revalidateTag` (unlike `updateTag`) is
// allowed in Route Handlers, which is exactly why webhooks use it.
//
//   GET  /api/revalidate?tag=isr-stat&mode=swr
//   POST /api/revalidate     { "tag": "isr-stat", "mode": "immediate" }
//
// Protect it in production by setting REVALIDATE_SECRET; callers must then send
// it as ?secret=... or an `x-revalidate-secret` header.

function isAuthorized(request: NextRequest): boolean {
  const required = process.env.REVALIDATE_SECRET
  // Demo mode: if no secret is configured, the endpoint is open so the buttons
  // and curl examples work out of the box.
  if (!required) return true
  const provided =
    request.headers.get('x-revalidate-secret') ??
    request.nextUrl.searchParams.get('secret')
  return provided === required
}

function run(request: NextRequest, tag: string | null, mode: InvalidateMode) {
  if (!isAuthorized(request)) {
    console.log(
      `[v0] webhook — REJECTED (missing/invalid secret) at ${new Date().toISOString()}`,
    )
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!tag) {
    return Response.json(
      { ok: false, error: 'Missing required "tag" parameter.' },
      { status: 400 },
    )
  }

  invalidateTag(tag, mode)

  return Response.json({
    ok: true,
    tag,
    mode,
    invalidatedAt: new Date().toISOString(),
    hint:
      mode === 'immediate'
        ? 'Entry expired now — the next visit blocks on fresh data.'
        : 'Entry marked stale — the next visit serves stale, then refreshes in the background.',
  })
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  return run(request, params.get('tag'), normalizeMode(params.get('mode')))
}

export async function POST(request: NextRequest) {
  const params = request.nextUrl.searchParams
  let tag = params.get('tag')
  let mode = params.get('mode')

  // Webhooks usually send JSON bodies; fall back to query params.
  try {
    const body = (await request.json()) as { tag?: string; mode?: string }
    tag = body.tag ?? tag
    mode = body.mode ?? mode
  } catch {
    // No/invalid JSON body — query params are used instead.
  }

  return run(request, tag, normalizeMode(mode))
}
