'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Overview', icon: '▦', group: 'Analytics' },
  { href: '/dashboard/repositories', label: 'Repositories', icon: '⬡', group: 'Analytics' },
  { href: '/dashboard/prs', label: 'Pull Requests', icon: '⌥', group: 'Analytics' },
  { href: '/dashboard/developers', label: 'Developers', icon: '◈', group: 'Analytics' },
  { href: '/dashboard/charts', label: 'Trends', icon: '↗', group: 'Insights' },
  { href: '/dashboard/retrospective', label: 'AI Insights', icon: '✦', group: 'Insights' },
  { href: '/dashboard/goals', label: 'Goals', icon: '◎', group: 'Insights' },
  { href: '/dashboard/jira', label: 'Integrations', icon: '⬢', group: 'Configure' },
  { href: '/dashboard/team', label: 'Team', icon: '◉', group: 'Configure' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙', group: 'Configure' },
]

const groups = ['Analytics', 'Insights', 'Configure']

type Props = {
  firstName: string | null
  username: string | null
  email: string | null
}

export default function MobileHeader({ firstName, username, email }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const currentPage = links.find(l => l.href === pathname)?.label ?? 'Dashboard'

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3"
        style={{ background: '#0B0917', borderBottom: '1px solid #2A2450', height: '56px' }}
      >
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="FlowLens" className="w-7 h-7 object-contain" />
          <span className="font-bold text-sm" style={{ color: '#F0EEFF' }}>FlowLens</span>
        </div>

        <div className="flex items-center gap-3">
          <UserButton signInUrl="/sign-in" />
          <button
            onClick={() => setOpen(true)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg"
            style={{ background: '#16122A', border: '1px solid #2A2450' }}
          >
            <span className="w-4 h-0.5 rounded" style={{ background: '#C4B8FF' }} />
            <span className="w-4 h-0.5 rounded" style={{ background: '#C4B8FF' }} />
            <span className="w-3 h-0.5 rounded" style={{ background: '#C4B8FF' }} />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="md:hidden fixed top-0 right-0 bottom-0 z-40 w-72 flex flex-col transition-transform duration-300"
        style={{
          background: '#0B0917',
          borderLeft: '1px solid #2A2450',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #2A2450' }}
        >
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="FlowLens" className="w-7 h-7 object-contain" />
            <span className="font-bold text-sm" style={{ color: '#F0EEFF' }}>FlowLens</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm"
            style={{ background: '#16122A', color: '#8B7EC8', border: '1px solid #2A2450' }}
          >
            ✕
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #2A2450' }}>
          <div className="flex items-center gap-3">
            <UserButton signInUrl="/sign-in" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#F0EEFF' }}>
                {firstName ?? username ?? 'User'}
              </p>
              <p className="text-xs truncate" style={{ color: '#6B5FA0' }}>
                {email ?? ''}
              </p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {groups.map(group => (
            <div key={group} className="mb-6">
              <p
                className="text-[10px] uppercase tracking-widest px-3 mb-2 font-semibold"
                style={{ color: '#4B4272' }}
              >
                {group}
              </p>
              <div className="space-y-0.5">
                {links
                  .filter(l => l.group === group)
                  .map(item => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm transition-all w-full rounded-r-lg"
                        style={
                          isActive
                            ? {
                                background: 'linear-gradient(90deg, rgba(124,58,237,0.25), rgba(124,58,237,0.05))',
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
                        <span className="font-medium">{item.label}</span>
                        {isActive && (
                          <span
                            className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: '#7C3AED', boxShadow: '0 0 6px rgba(124,58,237,0.8)' }}
                          />
                        )}
                      </Link>
                    )
                  })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  )
}