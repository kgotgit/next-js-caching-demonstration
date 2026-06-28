import type { ReactNode } from 'react'

type DemoHeaderProps = {
  directive: string
  title: string
  description: string
  /** When does this code run? e.g. "Build time", "Request time". */
  timing: string
  /** Where is the result stored? */
  storage: string
  children?: ReactNode
}

export function DemoHeader({
  directive,
  title,
  description,
  timing,
  storage,
  children,
}: DemoHeaderProps) {
  return (
    <header className="border-b border-border pb-8">
      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
        {directive}
      </span>
      <h1 className="mt-4 text-pretty text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
        {description}
      </p>

      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Runs at
          </dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground">
            {timing}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Stored in
          </dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground">
            {storage}
          </dd>
        </div>
      </dl>

      {children}
    </header>
  )
}

export function ObserveHint({ items }: { items: string[] }) {
  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/40 p-5">
      <p className="text-sm font-semibold text-foreground">What to observe</p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
          >
            <span
              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
