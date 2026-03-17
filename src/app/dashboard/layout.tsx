import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import SidebarNav from '@/components/sidebar-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="flex min-h-screen bg-[#080B0F] text-white">
      <aside className="w-56 border-r border-white/[0.06] flex flex-col fixed h-full z-10">
        
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #2A2450' }}>
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="FlowLens"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <div>
              <p className="font-bold text-sm" style={{ color: '#F0EEFF' }}>FlowLens</p>
              <p className="text-[10px]" style={{ color: '#6B5FA0' }}>Engineering Analytics</p>
            </div>
          </div>
        </div>

        <SidebarNav />

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-white/[0.06] flex items-center justify-between">
         <div className="text-xs text-gray-600 truncate">Signed in</div>
        <UserButton signInUrl="/sign-in" />        </div>
      </aside>

      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}
