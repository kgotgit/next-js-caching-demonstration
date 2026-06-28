'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { demoRoutes } from '@/lib/routes'

export function SiteNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1" aria-label="Cache demos">
      <Link
        href="/"
        className={cn(
          'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          pathname === '/'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        Overview
      </Link>

      <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Directives
      </p>

      {demoRoutes.map((route) => {
        const active = pathname === route.href
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'group rounded-lg px-3 py-2 transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className="block text-sm font-medium">{route.label}</span>
            <span
              className={cn(
                'mt-0.5 block font-mono text-xs',
                active
                  ? 'text-primary-foreground/80'
                  : 'text-muted-foreground/70',
              )}
            >
              {route.directive}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
