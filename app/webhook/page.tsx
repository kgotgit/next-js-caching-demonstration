import { DemoHeader, ObserveHint } from '@/components/demo-header'
import { WebhookTrigger } from '@/components/webhook-trigger'
import { CodeBlock } from '@/components/code-block'

export default function WebhookDemo() {
  return (
    <div className="flex flex-col gap-10">
      <DemoHeader
        directive="revalidateTag (Route Handler)"
        title="Webhook cache invalidation"
        description="A webhook at /api/revalidate invalidates a cache tag on demand. Route Handlers must use revalidateTag (updateTag is Server-Action only). Trigger it below and follow the invalidation flow across the logs."
        timing="Request time (on-demand)"
        storage="Targets the server cache handler (L2)"
      >
        <ObserveHint
          items={[
            "Stale (SWR) uses revalidateTag(tag, 'max'): the next visit serves stale data, then refreshes in the background.",
            'Expire now uses revalidateTag(tag, { expire: 0 }): the entry is dropped and the next visit blocks on fresh data.',
            'After triggering, open the affected page and watch its body re-execute followed by a fresh L2 WRITE in the logs.',
            "The private 'greeting' tag is browser-only, so a server webhook can't reach it.",
          ]}
        />
      </DemoHeader>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Invalidate a tag
        </h2>
        <WebhookTrigger />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          What you&apos;ll see in the logs
        </h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            One invalidation produces a sequence you can follow end to end. The
            tag is marked/expired immediately, but the page only{' '}
            <span className="text-card-foreground">regenerates on its next visit</span>:
          </p>
          <ol className="mt-4 flex flex-col gap-2 font-mono text-xs leading-relaxed">
            <li className="text-foreground">
              [v0] webhook — INVALIDATE tag=&apos;isr-stat&apos; mode=swr …
            </li>
            <li className="text-primary">
              [v0] cacheHandler:default — L2 INVALIDATE tags=[isr-stat] …
            </li>
            <li className="text-muted-foreground">… next visit to /isr …</li>
            <li className="text-foreground">
              [v0] isr &apos;use cache&apos; — REGENERATED …
            </li>
            <li className="text-primary">
              [v0] cacheHandler:default — L2 MISS → L2 WRITE …
            </li>
          </ol>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          SWR vs. immediate vs. updateTag
        </h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-3 font-semibold">Call</th>
                <th className="p-3 font-semibold">Where</th>
                <th className="p-3 font-semibold">Next request sees</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-t border-border">
                <td className="p-3">
                  <code className="font-mono text-xs text-card-foreground">
                    revalidateTag(tag, &apos;max&apos;)
                  </code>
                </td>
                <td className="p-3">Route Handler / Action</td>
                <td className="p-3">Stale immediately, fresh in background (SWR)</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3">
                  <code className="font-mono text-xs text-card-foreground">
                    revalidateTag(tag, {'{ expire: 0 }'})
                  </code>
                </td>
                <td className="p-3">Route Handler / Action</td>
                <td className="p-3">Blocks on fresh data (good for webhooks)</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3">
                  <code className="font-mono text-xs text-card-foreground">
                    updateTag(tag)
                  </code>
                </td>
                <td className="p-3">Server Action only</td>
                <td className="p-3">Fresh data, read-your-own-writes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Call it like an external service
        </h2>
        <CodeBlock
          filename="terminal"
          code={`# Stale-while-revalidate (recommended for most webhooks)
curl "$APP_URL/api/revalidate?tag=isr-stat&mode=swr"

# Immediate expiry (next request blocks on fresh data)
curl -X POST "$APP_URL/api/revalidate" \\
  -H 'content-type: application/json' \\
  -d '{ "tag": "price-widget-pro-USD", "mode": "immediate" }'

# With a secret (set REVALIDATE_SECRET in your environment)
curl "$APP_URL/api/revalidate?tag=isr-stat&secret=$REVALIDATE_SECRET"`}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          The webhook is open in this demo. Set{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono">REVALIDATE_SECRET</code>{' '}
          to require a <code className="rounded bg-muted px-1 py-0.5 font-mono">?secret=</code> query
          param or <code className="rounded bg-muted px-1 py-0.5 font-mono">x-revalidate-secret</code>{' '}
          header on every call.
        </p>
      </section>
    </div>
  )
}
