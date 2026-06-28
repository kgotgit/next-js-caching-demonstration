import { connection } from 'next/server'
import { expensiveWork } from '@/lib/demo'
import { ReadingCard } from './reading-card'

/**
 * A deliberately UNcached reading. Calling connection() opts this component
 * out of the static shell and defers it to request time, so every server
 * round-trip produces a fresh timestamp and token. Render it inside a
 * <Suspense> boundary so the static shell can stream while this resolves.
 */
export async function LiveReading({
  title = 'Live value (no cache)',
  note,
}: {
  title?: string
  note?: string
}) {
  await connection()
  const reading = await expensiveWork('Uncached · runs every request', 450)
  return (
    <ReadingCard variant="live" title={title} reading={reading} note={note} />
  )
}
