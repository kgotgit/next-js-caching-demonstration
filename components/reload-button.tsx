'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'

/**
 * Triggers a server round-trip without a full browser reload by calling
 * router.refresh(). This re-fetches the RSC payload, so cached scopes stay
 * frozen while live (uncached) scopes change — the clearest way to observe
 * the difference.
 */
export function ReloadButton({ className }: { className?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [count, setCount] = useState(0)

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(() => {
          router.refresh()
          setCount((c) => c + 1)
        })
      }}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-60',
        className,
      )}
    >
      <span
        className={cn(
          'size-2 rounded-full bg-primary',
          isPending && 'animate-ping',
        )}
        aria-hidden
      />
      {isPending ? 'Refreshing…' : 'Refresh (server round-trip)'}
      {count > 0 ? (
        <span className="font-mono text-xs text-muted-foreground">
          ×{count}
        </span>
      ) : null}
    </button>
  )
}
