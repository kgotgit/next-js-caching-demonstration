export type TierId = 'L0' | 'L1' | 'L2' | 'private'

export type TierStatus = 'primary' | 'used' | 'unused'

export type TierInfo = {
  /** Short tier name. */
  name: string
  /** Where the data physically lives. */
  where: string
  /** Generic description of the tier. */
  desc: string
}

// The canonical caching tiers, ordered from closest-to-the-user (fastest) to
// furthest. Every example maps each tier to a status + an optional note so the
// learner can see exactly which layers participate per directive.
export const TIER_META: Record<TierId, TierInfo> = {
  L0: {
    name: 'L0 · CDN / Edge',
    where: 'Global edge',
    desc: 'Fully cached HTML + RSC payload served from the edge without ever invoking the function.',
  },
  L1: {
    name: 'L1 · In-memory LRU',
    where: 'Per warm instance',
    desc: 'RAM cache inside the running function. Read first on the server; on a miss it is filled from L2, then serves repeat hits on that same instance. Lives and dies with the instance.',
  },
  L2: {
    name: 'L2 · Durable store',
    where: 'Function region',
    desc: 'ISR + Runtime Cache (the cacheHandler) — the durable source of truth. The function writes entries here, and reads from it whenever L1 is empty (cold start, new instance, after teardown). Because it is shared across instances, it repopulates L1 and lets every instance serve the same cached value.',
  },
  private: {
    name: 'Private · Browser',
    where: 'User device',
    desc: "Per-user 'use cache: private' entry. Never stored on the server or shared between users.",
  },
}

export const TIER_ORDER: TierId[] = ['L0', 'L1', 'L2', 'private']

export type TierMap = Partial<
  Record<TierId, { status: TierStatus; note?: string }>
>
