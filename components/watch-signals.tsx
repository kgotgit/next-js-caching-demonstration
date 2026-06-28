import type { ReactNode } from 'react'

export type Signal = {
  /** The exact token to look for — rendered in monospace. */
  code: string
  /** What it means / what to expect. */
  detail: ReactNode
}

type WatchSignalsProps = {
  /** What changes on screen. */
  ui: Signal[]
  /** What to look for in the browser DevTools → Network tab. */
  network: Signal[]
  /** What prints in the Vercel logs (or local terminal). */
  logs: Signal[]
}

function SignalColumn({
  title,
  hint,
  accentClass,
  signals,
}: {
  title: string
  hint: string
  accentClass: string
  signals: Signal[]
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className={`size-2 shrink-0 rounded-full ${accentClass}`} aria-hidden />
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {signals.map((signal, i) => (
          <li key={i} className="flex flex-col gap-1.5">
            <code className="w-fit max-w-full break-words rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">
              {signal.code}
            </code>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {signal.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * A consistent three-lane "trace" that connects what you SEE in the UI to the
 * Network tab headers/requests and the Vercel server logs — so it's easy to
 * line up the same cache event across all three surfaces.
 */
export function WatchSignals({ ui, network, logs }: WatchSignalsProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Connect the dots: UI ↔ Network ↔ Logs
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The same cache event shows up in three places. Trigger an action above,
          then line these up to see one event from all three angles.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SignalColumn
          title="On screen"
          hint="What you see in this preview."
          accentClass="bg-primary"
          signals={ui}
        />
        <SignalColumn
          title="Browser · Network tab"
          hint="DevTools → Network. Click a request → Headers."
          accentClass="bg-cached"
          signals={network}
        />
        <SignalColumn
          title="Vercel logs · terminal"
          hint="Deployment → Logs (or your dev terminal)."
          accentClass="bg-live"
          signals={logs}
        />
      </div>
    </section>
  )
}
