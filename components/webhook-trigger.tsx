'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { knownTags } from '@/lib/cache-tags'
import { triggerInvalidate } from '@/app/webhook/actions'
import { cn } from '@/lib/utils'

type LogLine = { id: number; text: string; tone: 'in' | 'ok' | 'err' }

export function WebhookTrigger() {
  const [isPending, startTransition] = useTransition()
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [log, setLog] = useState<LogLine[]>([])

  function append(text: string, tone: LogLine['tone']) {
    setLog((prev) => [{ id: Date.now() + Math.random(), text, tone }, ...prev].slice(0, 8))
  }

  function fire(tag: string, mode: 'swr' | 'immediate') {
    setActiveTag(tag)
    append(`→ POST invalidate  tag='${tag}'  mode=${mode}`, 'in')
    startTransition(async () => {
      try {
        const res = await triggerInvalidate(tag, mode)
        append(
          `✓ invalidated '${res.tag}' (${res.mode}) — now visit the page and watch it regenerate`,
          'ok',
        )
      } catch {
        append(`✗ failed to invalidate '${tag}'`, 'err')
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-3">
        {knownTags.map((t) => (
          <div
            key={t.tag}
            className={cn(
              'rounded-xl border border-border bg-card p-4',
              !t.invalidatable && 'opacity-70',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-card-foreground">
                    {t.tag}
                  </code>
                  <Link
                    href={t.href}
                    className="text-xs text-primary underline-offset-4 hover:underline"
                  >
                    {t.pageLabel}
                  </Link>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {t.note}
                </p>
              </div>

              {t.invalidatable ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => fire(t.tag, 'swr')}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary disabled:opacity-50"
                  >
                    Stale (SWR)
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => fire(t.tag, 'immediate')}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Expire now
                  </button>
                </div>
              ) : (
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Not reachable
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Client trace
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            The full flow appears in your <span className="text-card-foreground">server / Vercel logs</span>
            {' '}— this panel only echoes the request.
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 font-mono text-xs">
            {log.length === 0 ? (
              <li className="text-muted-foreground">No invalidations triggered yet.</li>
            ) : (
              log.map((l) => (
                <li
                  key={l.id}
                  className={cn(
                    'leading-relaxed',
                    l.tone === 'in' && 'text-foreground',
                    l.tone === 'ok' && 'text-primary',
                    l.tone === 'err' && 'text-destructive',
                  )}
                >
                  {l.text}
                </li>
              ))
            )}
          </ul>
        </div>

        {activeTag ? (
          <Link
            href={knownTags.find((t) => t.tag === activeTag)?.href ?? '/'}
            className="rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm text-card-foreground transition-colors hover:border-primary"
          >
            <span className="font-medium">Open the affected page →</span>
            <p className="mt-1 text-xs text-muted-foreground">
              Reload it and watch the page body re-execute, then a fresh L2 WRITE in the logs.
            </p>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
