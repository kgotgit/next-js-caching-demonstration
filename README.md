# Next.js 16.3 Cache Components — Interactive Demonstration

An interactive, log-traceable demonstration of the **Cache Components** model in
Next.js 16.3 (`use cache`, `use cache: remote`, `use cache: private`), built with
[v0](https://v0.app). Every example is wired to print structured `[v0] ...` logs
so you can watch caching, tiering, and invalidation happen in real time (locally
or in the Vercel logs).

> **Version note:** Next.js `16.3.0` stable was not yet published when this was
> built, so the project pins `16.3.0-preview.5` — the most stable release on the
> 16.3 line that ships the `use cache: remote` and `use cache: private`
> directives. `cacheComponents: true` is enabled in `next.config.mjs`.

---

## Quick start

```bash
pnpm install
pnpm dev      # explore the demos with live logs
pnpm build    # see the prerender split: ○ Static vs ◐ Partial Prerender vs ƒ Dynamic
```

Open [http://localhost:3000](http://localhost:3000). The overview page is the
recommended starting point — it explains the directives, the cache tiers, the
storage model, the scopes, and the decision patterns before you dive into the
individual demos.

---

## The mental model in one minute

- **Directives** decide *what* is cached and *where it lives*:
  - `'use cache'` — shared, server-side cache (in-memory + durable store).
  - `'use cache: remote'` — shared durable cache, bypasses per-instance memory.
  - `'use cache: private'` — per-browser cache, may read cookies/headers, never stored on the server.
- **Scopes** decide *how much* is cached — place the directive at the **file**,
  **component**, or **function** level.
- **Tiers** decide *how close to the user* a cached value is served from:
  - **L0** — CDN / edge (static shell, function never runs).
  - **L1** — in-memory LRU inside the warm function instance (dies on teardown).
  - **L2** — durable regional store (survives teardown; the basis for ISR).
  - **Private** — the user's own browser.
- **Invalidation** (`revalidateTag` / `updateTag`) expires tagged entries; the
  next request regenerates them on demand.

---

## Routes / examples

| Route | Directive | Demonstrates |
|---|---|---|
| `/` | — | Overview: directives, tiers, storage model, scopes, patterns, nesting |
| `/page-level` | `'use cache'` (file) | Whole route cached & fully prerendered at build (`○ Static`) |
| `/dynamic-isr` + `/dynamic-isr/[slug]` | `'use cache'` + `params` | ISR — partial `generateStaticParams`, generate-on-first-request, App Shell |
| `/function-level` | `'use cache'` (function) | One cached function reused across components vs. a live value |
| `/fetch-level` | `'use cache'` around `fetch()` | Cached vs. uncached network requests |
| `/isr` | `'use cache'` + `cacheLife` + `cacheTag` | Time-based revalidation + on-demand `updateTag` |
| `/remote` | `'use cache: remote'` | Shared durable cache keyed per currency |
| `/private` | `'use cache: private'` | Per-browser cache that reads the visitor cookie |
| `/composition` | nested `'use cache'` | Inner-tag invalidation bubbling up to the outer page |
| `/webhook` | `revalidateTag` | On-demand tag invalidation + full log trace |
| `/api/revalidate` | `revalidateTag` | The webhook itself (GET/POST, optional secret) |

---

## How to read the logs

Every cached body and every cache-store operation logs with a `[v0]` prefix.
The core rule:

> **A log line means the body executed (cache MISS / regeneration). No new log
> line on refresh means it was served from cache (HIT).**

A first-time generation looks like this:

```
[v0] cacheHandler:default — L2 MISS  key=[...]
[v0] function-level 'use cache' — function BODY EXECUTED at <time>
[v0] cacheHandler:default — L2 WRITE key=[...]
```

A later cached read looks like this (note: no BODY EXECUTED):

```
[v0] cacheHandler:default — L2 HIT key=[...]
```

A tag invalidation looks like this:

```
[v0] webhook — INVALIDATE tag='isr-stat' mode=immediate
[v0] cacheHandler:default — L2 INVALIDATE tags=[isr-stat]
[v0] cacheHandler:remote  — L2 INVALIDATE tags=[isr-stat]
```

The logging cache handler (`cache-handlers/`) wraps Next.js's real
`createDefaultCacheHandler`, so it preserves correct stream/expiry/tag behavior
and only *adds* logging. In production you would swap the wrapped store for
Redis/DynamoDB for true cross-deployment durability.

### Why you can't exclude the deploymentId from the cache key

A common question is whether you can strip the build/deployment ID out of the
key so `'use cache'` entries survive a new deploy. **You can't do it cleanly,
and here's why:**

- Every `'use cache'` key is composed **upstream, before your handler runs**.
  The first segment is the **Build ID** (or `deploymentId`, if configured, which
  overrides it). By the time your handler's `get(cacheKey, …)` / `set(cacheKey,
  …)` is called, `cacheKey` is already an **opaque, fully-composed string** —
  there is no separate "deploymentId" field to omit.
- This is **intentional**, not an oversight. A new deploy can change component
  logic or the shape of the serialized RSC/Flight payload. The build ID acts as
  a **safety boundary**: reusing an old entry under new code could deserialize
  into something incompatible. So the framework deliberately invalidates all
  `'use cache'` / `'use cache: remote'` entries on every deploy.
- You *could* regex the build-hash segment out of `cacheKey` in the handler
  before hitting your store, but that is **unsupported and unsafe** — it defeats
  the boundary above and risks serving an old payload into a new build.

**Supported ways to actually persist across deploys:**

| Goal | Use |
|---|---|
| Persist `fetch` responses across deploys | Native **fetch Data Cache** — `fetch(url, { next: { revalidate, tags } })`, keyed by URL/options, not the build ID |
| Persist non-fetch computed data across deploys | **`unstable_cache`** — the one built-in API whose entries persist across requests *and* deployments (see the note below) |
| Pin the key yourself | Set a **stable, constant `deploymentId`** in `next.config.js` so it stops changing per deploy (you then own the risk of keeping payload shapes compatible / busting it manually) |

> **Note on `unstable_cache` (Next.js 16):** it has **not** been renamed to
> `getCache`/`setCache` and is **not** removed — it is still exported from
> `next/cache` and still works. The official docs mark it as **"replaced by the
> `use cache` directive"** and recommend migrating to Cache Components. The
> catch: the recommended successor, `'use cache'`, does **not** persist across
> deploys (its key includes the build ID), whereas `unstable_cache`
> specifically **does**. So until an official cross-deploy story lands for
> `'use cache'`, `unstable_cache` remains the built-in option when you truly
> need entries to survive a deploy.

> Bottom line: treat `'use cache'` / `'use cache: remote'` as durable **within a
> deployment**. For genuine cross-deploy persistence, reach for the fetch Data
> Cache or `unstable_cache` rather than trying to manipulate the cache key.

### Visualizing the cache entries themselves

Alongside the `HIT/MISS/WRITE` one-liners, the handler dumps what each entry
actually contains on every read and write:

```
[v0] cacheHandler:default — L2 ENTRY (HIT) key=…
        tags=[page-level] created=2026-… stale=300s revalidate=86400s expire=604800s
[v0] cacheHandler:default — L2 VALUE (HIT) key=… ~19075 bytes (RSC/Flight payload)
        ":N1782…\n2:[[\"PageLevelDemo\",…   …(truncated)
```

- **`L2 ENTRY`** prints the metadata: `tags`, creation time, and the three
  `cacheLife` thresholds (`stale` / `revalidate` / `expire`, in seconds).
- **`L2 VALUE`** prints the byte size and a capped preview of the serialized
  RSC/Flight payload — the actual bytes stored in L2.

Implementation note: the entry's `value` is a one-shot `ReadableStream`, so the
handler **tees** it — one copy goes to the real consumer, the other is read
(capped at 16 KB) only for the preview. This never blocks or drains the stream
the page depends on. Set `CACHE_LOG_ENTRIES=0` to silence these dumps and keep
only the one-liners.

> Caveat: Next.js loads `cacheHandler` modules **once at server startup** and
> does not hot-reload them. After editing anything in `cache-handlers/`, restart
> the dev server (`next dev`) or rebuild — a hot reload alone will keep running
> the old handler.

### Observation: the `POST` → `GET` pattern in the logs (not a bug)

When you interact with the currency switcher (`/remote`), the name picker
(`/private`), "Revalidate now" (`/isr`), or the webhook trigger, you will see a
`POST` to the current route immediately followed by a `GET` (often
`?_rsc=…`). **This is expected** — it is the normal Server Action lifecycle, not
a redirect loop or a misconfiguration.

- A Server Action (`'use server'`) compiles to a reference that **POSTs back to
  the same route**, carrying a `Next-Action: <id>` header. That `POST` is the
  action *executing* — it is not a page load.
- After the action runs, the router needs fresh UI, so what follows depends on
  what the action did:

| What you see | Why |
|---|---|
| `POST /route` + `Next-Action` header | The Server Action firing |
| The **POST response itself is an RSC/Flight stream** (no separate GET) | A re-render was bundled in — happens when the action sets a **cookie**, or calls `updateTag` / `revalidatePath` / `refresh` / `redirect`. This is why `/remote` and `/private` (which set cookies) refresh in place. |
| A following **`GET /route?_rsc=…`** | The router fetching fresh RSC on a *later* read — typical after a `revalidateTag` with the **SWR (`'max'`) profile**, which deliberately does **not** bundle a re-render into the action response. |
| A `GET` of a **different** route after the `POST` | The action called `redirect()`. |

> Rule of thumb: `POST` = the action ran; the trailing `GET`/RSC fetch = the
> router reconciling the UI afterward. Cookie-setting and immediate-invalidation
> actions re-render *inside* the POST response; `'max'` (SWR) defers the refresh
> to a subsequent GET.

---

## Cache tags (for manual invalidation)

Every `'use cache'` usage carries a `cacheTag`, registered in `lib/cache-tags.ts`
so it automatically appears as a button on `/webhook` and is curl-able via the
API. Invalidate any of them:

```bash
# stale-while-revalidate (recommended for most cases)
curl "http://localhost:3000/api/revalidate?tag=page-level&mode=max"

# immediate hard expiry
curl "http://localhost:3000/api/revalidate?tag=composition-inner&mode=immediate"
```

| Tag | Page |
|---|---|
| `page-level` | `/page-level` |
| `function-level` | `/function-level` |
| `fetch-level-posts` | `/fetch-level` |
| `isr-stat` | `/isr` |
| `price-widget-pro-{USD,EUR,GBP}` | `/remote` |
| `composition-page`, `composition-inner` | `/composition` |
| `greeting` | `/private` — **browser-only, not reachable from a server webhook** |

---

## Conversation history — questions & decisions (for traceability)

This project was built iteratively in v0. The chain of thought is captured here
so future readers understand *why* each piece exists.

### 1. Initial build
**Ask:** "Create a Next.js 16.3.0 app demonstrating page-level, function-level,
and fetch-level caching with `use cache`, `use cache: remote`, and
`use cache: private`; show build-time vs runtime (dynamic), and ISR if possible."
**Done:** Upgraded to `16.3.0-preview.5`, enabled `cacheComponents`, built the
overview + seven demos (page/function/fetch level, ISR, remote, private), a
theme, nav, and shared components. Verified with a production build (correct
`○`/`◐` split) and in-browser.

### 2. Add observability logs
**Ask:** "Add a console log with time inside these functions to monitor in the
Vercel logs whether it renders a cached response or executes the whole function."
**Done:** Added timestamped `[v0] ... BODY EXECUTED` logs inside every cached
function. Established the "log = MISS, no log = HIT" reading rule.

### 3. Page-level cache as ISR
**Ask:** "Can the page-level cache be ISR instead of build time? Does it work if
the shell isn't generated at build, and what are the consequences?"
**Done:** Explained that a plain route is always prerendered at build; to defer
to first-request you need a dynamic route with a partial `generateStaticParams`.
Built `/dynamic-isr/[slug]` (prebuilt `alpha` + on-demand others). Fixed two
real prerender bugs surfaced by this: `usePathname()` in the nav and a top-level
`await params` both had to move inside `<Suspense>`.

### 4. Make ISR its own example
**Ask:** "Add it as a separate example."
**Done:** Promoted the dynamic route to a top-level `/dynamic-isr` example with
its own landing page and nav entry; replaced the inline section on `/page-level`
with a pointer link.

### 5–6. Cache persistence across builds vs requests; serverless lifecycle
**Asks:** "How do we ensure ISR cache persists across builds vs across requests?"
… "When a request comes, a serverless function spins up … if it goes down does
the next request rebuild?" … "Within the same deployment, across time, when the
short-lived function goes down?"
**Done:** Explained the two-tier model — in-memory L1 (dies with the instance)
vs. durable L2 (deployment-level, survives teardown). Key correction: on Vercel,
a function dying does **not** cause a rebuild; a cold instance reads from L2.
Regeneration only happens on `cacheLife` expiry, tag invalidation, eviction, or
redeploy. Added a persistence callout to `/dynamic-isr`.

### 7. Where does L2 live?
**Ask:** "Where is L2 stored — edge DB or runtime cache?"
**Done:** Clarified L2 is Vercel's durable **regional** storage (ISR cache +
Runtime Cache), not an edge DB; the edge/CDN is a separate L0 tier in front of it.

### 8. Visualize tiers + logging cache handler
**Ask:** "Add a clear L0/L1/L2/Private distinction for each example, and a
`cacheHandler` log to connect the dots in the Vercel logs."
**Done:** Added the `CacheTiers` strip to all examples (`lib/cache-tiers.ts` +
`components/cache-tiers.tsx`) and a logging `cacheHandler` wrapping Next's real
default handler, wired into `next.config.mjs` for `default` and `remote`.

### 9. Webhook invalidation
**Ask:** "Add a webhook to invalidate cache tags manually and see the
invalidation flow in the logs."
**Done:** Built `/api/revalidate` (secret-protected, SWR vs. immediate modes), a
`lib/revalidate.ts` helper, a `lib/cache-tags.ts` registry, a Server Action
wrapper, and the `/webhook` page with a live client trace. Verified the full
invalidate → regenerate → re-cache log sequence.

### 10. L0/L1/L2/Private explainer on the overview
**Ask:** "Add a section to the overview detailing what L0, L1, L2, and Private
are."
**Done:** Added the "Where caches live" section reusing `TIER_META`, with
per-tier durability across teardown/deploy.

### 11. Build-time storage + file-level meaning + ISR
**Asks:** "Is the build-time shell stored along with the function? What does
file-level caching mean, and is it true for ISR too?"
**Done:** Added two overview sections — "How the shell is stored: build time vs
ISR" and "Caching scopes: file/component/function level."

### 12. Clarify "runtime APIs"
**Ask:** "On page-level, what does 'with no runtime APIs in play, the page is
fully prerendered' mean? Clarify in the document."
**Done:** Added a "What does 'no runtime APIs in play' mean?" section to
`/page-level`, defining runtime APIs (`cookies()`, `headers()`, `searchParams`,
`connection()`, …) with the static-vs-deferred contrast.

### 13. Invalidating a build-time cache + tag everything
**Asks:** "What happens when you invalidate a build-time page-level cache? Add
cache tags wherever `use cache` is used and wire them to the webhook."
**Done:** Added `cacheTag` to the previously-untagged `page-level`,
`function-level`, and `fetch-level-posts` caches; registered them; documented
that invalidating a build-time page does **not** rebuild the app — it triggers a
single on-demand (ISR-style) regeneration on the next request. Verified in logs.

### 14. Composition / nesting patterns
**Asks:** "When/how to use each strategy? With a page/function cache, do you still
need a fetch-level cache? Can a fetch-level cache be served across builds? If you
invalidate only the inner (fetch) tag, does the outer page regenerate too?"
**Done:** Added the "Patterns: which strategy, and when" decision table and the
"Composing & nesting caches" Q&A to the overview, backed by a new `/composition`
demo (tagged inner cache nested in a tagged page cache). **Empirically verified**
that invalidating only `composition-inner` regenerates the outer page too —
tags bubble up. Answers:
1. You don't need an inner fetch cache for correctness (the outer cache freezes
   the whole subtree); add one only for separate lifetime/tag/dynamic reuse.
2. A `'use cache'`-wrapped fetch is **not** served across builds (key includes
   the deployment); use the native fetch Data Cache / `unstable_cache` for that.
3. Invalidating an inner tag purges the outer entry too, so you never serve a
   stale page around fresh inner data.

---

## Project structure

```
app/
  page.tsx                  Overview (directives, tiers, storage, scopes, patterns, nesting)
  page-level/page.tsx       File-level 'use cache' (build-time, ○ Static)
  dynamic-isr/
    page.tsx                ISR landing + slug picker + persistence callout
    [slug]/page.tsx         On-demand generation via partial generateStaticParams
  function-level/page.tsx   Function-level 'use cache'
  fetch-level/page.tsx      Cached vs uncached fetch
  isr/page.tsx              cacheLife + cacheTag + updateTag
  remote/page.tsx           'use cache: remote'
  private/page.tsx          'use cache: private'
  composition/page.tsx      Nested caches + tag bubbling
  webhook/
    page.tsx                Webhook trigger UI + log narration
    actions.ts              Server Action wrapper
  api/revalidate/route.ts   The webhook endpoint (revalidateTag)

cache-handlers/
  create-logging-handler.js Wraps Next's createDefaultCacheHandler + adds logs
  default-handler.js        'default' tier entry
  remote-handler.js         'remote' tier entry

lib/
  cache-tiers.ts            L0/L1/L2/Private metadata
  cache-tags.ts             Tag registry feeding /webhook + the API
  revalidate.ts             revalidateTag helper with logging
  routes.ts                 Nav + demo route registry
  demo.ts                   Shared "expensive work" + token helpers

next.config.mjs             cacheComponents: true + cacheHandlers wiring
```

---

## Key takeaways

- **Build-time prerender and ISR produce the same artifact** (HTML shell + RSC
  payload) — build writes it during `next build`; ISR writes it on first request
  into L2. After that, they're served identically.
- **L1 is ephemeral, L2 is durable.** A serverless function shutting down does
  not rebuild the cache — that's what L2 is for.
- **`'use cache'` caches are build-scoped**; for cross-deploy persistence use a
  custom `cacheHandler` (server caches) or the native fetch Data Cache.
- **Tags bubble up.** Invalidating an inner cache regenerates everything that
  embeds it, so caches compose safely.
- **`use cache: private` never touches the server cache** and is never reachable
  by a server-side webhook.

---

## Learn more

- [Cache Components](https://nextjs.org/docs/app/getting-started/cache-components)
- [`use cache` directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [`cacheHandlers` config](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers)
- [v0 Documentation](https://v0.app/docs)

[Continue working on v0 →](https://v0.app/chat/projects/prj_8vNsYAKX7tpYFv59KSmTttrOIkkL)
