import { cn } from '@/lib/utils'

type CodeBlockProps = {
  code: string
  /** Optional filename shown in the header bar. */
  filename?: string
  className?: string
}

export function CodeBlock({ code, filename, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      {filename ? (
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
          <span className="size-3 rounded-full bg-border" aria-hidden />
          <span className="font-mono text-xs text-muted-foreground">
            {filename}
          </span>
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-card-foreground">{code}</code>
      </pre>
    </div>
  )
}
