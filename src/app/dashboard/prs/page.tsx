import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function PRsPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: user.id },
  })

  if (!org) redirect('/dashboard')

  const prs = await prisma.pullRequest.findMany({
    where: {
      repo: { orgId: org.id },
      mergedAt: { not: null },
    },
    include: { repo: true },
    orderBy: { mergedAt: 'desc' },
    take: 50,
  })

  const avgCycleTime = prs.length > 0
    ? prs.reduce((sum, pr) => sum + (pr.cycleTimeHrs ?? 0), 0) / prs.length
    : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <a href="/dashboard" className="text-gray-400 hover:text-white transition">← Back</a>
          <h1 className="text-2xl font-bold">Pull Request Analytics</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Total Merged PRs</p>
            <p className="text-4xl font-bold">{prs.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Avg Cycle Time</p>
            <p className="text-4xl font-bold">{Math.round(avgCycleTime * 10) / 10}</p>
            <p className="text-gray-500 text-sm mt-1">hours</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Repos Tracked</p>
            <p className="text-4xl font-bold">{new Set(prs.map(pr => pr.repoId)).size}</p>
          </div>
        </div>

        {/* PR Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Author</div>
            <div className="col-span-2">Repo</div>
            <div className="col-span-1 text-right">+/-</div>
            <div className="col-span-2 text-right">Cycle Time</div>
          </div>

          {prs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No merged PRs found. Sync your GitHub data first.
            </div>
          ) : (
            prs.map((pr) => (
              <div key={pr.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-800 hover:bg-gray-800 transition">
                <div className="col-span-5 truncate text-sm">{pr.title}</div>
                <div className="col-span-2 text-sm text-gray-400">{pr.authorLogin}</div>
                <div className="col-span-2 text-sm text-gray-400 truncate">{pr.repo.name}</div>
                <div className="col-span-1 text-right text-xs">
                  <span className="text-green-400">+{pr.additions}</span>
                  <span className="text-gray-600 mx-1">/</span>
                  <span className="text-red-400">-{pr.deletions}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    (pr.cycleTimeHrs ?? 0) < 24
                      ? 'bg-green-900 text-green-300'
                      : (pr.cycleTimeHrs ?? 0) < 48
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {pr.cycleTimeHrs ? `${Math.round(pr.cycleTimeHrs)}h` : '—'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}