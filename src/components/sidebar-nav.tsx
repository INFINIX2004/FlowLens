'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Overview', icon: '▦' },
  { href: '/dashboard/prs', label: 'Pull Requests', icon: '⌥' },
  { href: '/dashboard/charts', label: 'Trends', icon: '↗' },
  { href: '/dashboard/retrospective', label: 'AI Retro', icon: '✦' },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {links.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group ${
              isActive
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-500 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <span className={`text-xs w-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
              {item.icon}
            </span>
            {item.label}
            {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-blue-400" />}
          </Link>
        )
      })}
    </nav>
  )
}