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
    desc: 'RAM cache inside the running function. Fastest server tier, but lives and dies with the instance.',
  },
  L2: {
    name: 'L2 · Durable store',
    where: 'Function region',
    desc: 'ISR + Runtime Cache (the cacheHandler). Survives teardown and is shared across instances.',
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
