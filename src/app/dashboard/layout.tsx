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
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center text-sm">⚡</div>
            <span className="font-semibold tracking-tight text-white">FlowLens</span>
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
