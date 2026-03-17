import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import SidebarNav from '@/components/sidebar-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()

  return (
    <div className="flex min-h-screen" style={{ background: '#0E0B1E' }}>
      {/* Sidebar — hidden on mobile, fixed on desktop */}
      <aside
        className="hidden md:flex w-60 flex-col fixed h-full z-10"
        style={{ background: '#0B0917', borderRight: '1px solid #2A2450' }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #2A2450' }}>
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="FlowLens" className="w-8 h-8 object-contain" />
            <div>
              <p className="font-bold text-sm" style={{ color: '#F0EEFF' }}>FlowLens</p>
              <p className="text-[10px]" style={{ color: '#6B5FA0' }}>Engineering Analytics</p>
            </div>
          </div>
        </div>

        <SidebarNav />

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #2A2450' }}>
          <div className="flex items-center gap-3">
            <UserButton signInUrl="/sign-in" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#F0EEFF' }}>
                {user?.firstName ?? user?.username ?? 'User'}
              </p>
              <p className="text-[10px] truncate" style={{ color: '#6B5FA0' }}>
                {user?.emailAddresses[0]?.emailAddress ?? ''}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <MobileHeader
        firstName={user?.firstName ?? null}
        username={user?.username ?? null}
        email={user?.emailAddresses[0]?.emailAddress ?? null}
      />

      {/* Main content */}
      <main className="flex-1 md:ml-60 min-h-screen pt-14 md:pt-0" style={{ background: '#0E0B1E' }}>
        {children}
      </main>
    </div>
  )
}

// We need a client component for the mobile menu toggle
import MobileHeader from '@/components/mobile-header'