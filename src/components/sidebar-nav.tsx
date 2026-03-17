'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Overview', icon: '▦', group: 'main' },
  { href: '/dashboard/repositories', label: 'Repositories', icon: '⬡', group: 'main' },
  { href: '/dashboard/prs', label: 'Pull Requests', icon: '⌥', group: 'main' },
  { href: '/dashboard/developers', label: 'Developers', icon: '◈', group: 'main' },
  { href: '/dashboard/charts', label: 'Trends', icon: '↗', group: 'insights' },
  { href: '/dashboard/retrospective', label: 'AI Insights', icon: '✦', group: 'insights' },
  { href: '/dashboard/goals', label: 'Goals', icon: '◎', group: 'insights' },
  { href: '/dashboard/jira', label: 'Integrations', icon: '⬢', group: 'config' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙', group: 'config' },
]

const groups = [
  { id: 'main', label: 'Analytics' },
  { id: 'insights', label: 'Insights' },
  { id: 'config', label: 'Configure' },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto">
      {groups.map((group) => (
        <div key={group.id} className="mb-6">
          <p
            className="text-[10px] uppercase tracking-widest px-3 mb-2 font-semibold"
            style={{ color: '#4B4272' }}
          >
            {group.label}
          </p>
          <div className="space-y-0.5">
            {links
              .filter((l) => l.group === group.id)
              .map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm transition-all w-full rounded-r-lg"
                    style={
                      isActive
                        ? {
                            background:
                              'linear-gradient(90deg, rgba(124,58,237,0.25), rgba(124,58,237,0.05))',
                            borderLeft: '2px solid #7C3AED',
                            color: '#C4B8FF',
                          }
                        : {
                            color: '#6B5FA0',
                            borderLeft: '2px solid transparent',
                          }
                    }
                  >
                    <span className="text-xs w-4 shrink-0">{item.icon}</span>
                    <span className="truncate font-medium">{item.label}</span>
                    {isActive && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          background: '#7C3AED',
                          boxShadow: '0 0 6px rgba(124,58,237,0.8)',
                        }}
                      />
                    )}
                  </Link>
                )
              })}
          </div>
        </div>
      ))}
    </nav>
  )
}