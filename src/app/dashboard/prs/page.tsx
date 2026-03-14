import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function PRsPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: user.id } })
  if (!org) redirect('/dashboard')

  const prs = await prisma.pullRequest.findMany({
    where: { repo: { orgId: org.id }, mergedAt: { not: null } },
    include: { repo: true },
    orderBy: { mergedAt: 'desc' },
    take: 50,
  })

  const avgCycleTime = prs.length > 0
    ? prs.reduce((sum, pr) => sum + (pr.cycleTimeHrs ?? 0), 0) / prs.length : 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Pull Requests</h1>
        <p className="text-gray-500 text-sm mt-0.5">Cycle times and review analytics</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Merged PRs', value: prs.length },
          { label: 'Avg Cycle Time', value: `${Math.round(avgCycleTime * 10) / 10}h` },
          { label: 'Repos Tracked', value: new Set(prs.map(pr => pr.repoId)).size },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">{s.label}</p>
            <p className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06]">
          {['Title', 'Author', 'Repo', '+/−', 'Cycle Time'].map((h, i) => (
            <div key={h} className={`text-xs uppercase tracking-widest text-gray-600 ${i === 0 ? 'col-span-5' : i === 3 ? 'col-span-1 text-right' : i === 4 ? 'col-span-2 text-right' : 'col-span-2'}`}>{h}</div>
          ))}
        </div>

        {prs.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-600 text-sm">No merged PRs found. Sync your GitHub data.</div>
        ) : prs.map((pr) => (
          <div key={pr.id} className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-all">
            <div className="col-span-5 text-sm truncate text-gray-200">{pr.title}</div>
            <div className="col-span-2 text-sm text-gray-500">{pr.authorLogin}</div>
            <div className="col-span-2 text-sm text-gray-500 truncate">{pr.repo.name}</div>
            <div className="col-span-1 text-right text-xs">
              <span className="text-emerald-500">+{pr.additions}</span>
              <span className="text-gray-700 mx-0.5">/</span>
              <span className="text-red-500">-{pr.deletions}</span>
            </div>
            <div className="col-span-2 text-right">
              <span className={`text-xs font-mono px-2 py-1 rounded-md ${
                (pr.cycleTimeHrs ?? 0) < 24 ? 'bg-emerald-500/10 text-emerald-400' :
                (pr.cycleTimeHrs ?? 0) < 48 ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {pr.cycleTimeHrs ? `${Math.round(pr.cycleTimeHrs)}h` : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}