import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { Suspense } from 'react'
import { SiteNav, SiteNavFallback } from '@/components/site-nav'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Cache Components Playground · Next.js 16.3',
  description:
    'An interactive demo of the Next.js Cache Components directives: use cache, use cache: remote, and use cache: private, including build-time, runtime, and ISR-style revalidation.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#15171f' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
          <aside className="border-b border-border lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <div className="flex h-full flex-col gap-6 p-6">
              <Link href="/" className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Next.js 16.3
                </span>
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  Cache Components
                </span>
              </Link>
              {/* usePathname() is runtime data. Wrapping the nav in Suspense
                  lets Next.js prerender a static App Shell (with no item
                  highlighted) for dynamic routes like /page-level/[slug], then
                  stream the active state in on the client. */}
              <Suspense fallback={<SiteNavFallback />}>
                <SiteNav />
              </Suspense>
            </div>
          </aside>

          <main className="min-w-0 flex-1 px-6 py-10 lg:px-12">
            <div className="mx-auto w-full max-w-3xl">{children}</div>
          </main>
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
