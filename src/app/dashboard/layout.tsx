import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  return (
    <div className="flex min-h-screen bg-[#080B0F] text-white" style={{ fontFamily: "'GeistSans', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside className="fixed z-10 flex h-full w-56 flex-col border-r border-white/[0.06]">
        {/* Logo */}
        <div className="border-b border-white/[0.06] px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500 text-[10px] font-semibold">FL</div>
            <span className="font-semibold tracking-tight text-white">FlowLens</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {[
            { href: '/dashboard', label: 'Overview', icon: 'OV' },
            { href: '/dashboard/prs', label: 'Pull Requests', icon: 'PR' },
            { href: '/dashboard/charts', label: 'Trends', icon: 'TR' },
            { href: '/dashboard/retrospective', label: 'AI Retro', icon: 'AI' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-400 transition-all hover:bg-white/[0.05] hover:text-white"
            >
              <span className="w-4 text-xs opacity-60 transition-opacity group-hover:opacity-100">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-4">
          <div className="text-xs text-gray-600">{user.firstName ?? user.username}</div>
          <UserButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 min-h-screen flex-1">{children}</main>
    </div>
  )
}
