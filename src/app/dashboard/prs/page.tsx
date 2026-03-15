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

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  const round = (n: number | null) => n !== null ? Math.round(n * 10) / 10 : null

  const avgCycleTime = round(avg(prs.map(p => p.cycleTimeHrs ?? 0)))
  const avgCodingTime = round(avg(prs.filter(p => p.codingTimeHrs).map(p => p.codingTimeHrs!)))
  const avgReviewWait = round(avg(prs.filter(p => p.reviewWaitHrs).map(p => p.reviewWaitHrs!)))
  const avgReviewTime = round(avg(prs.filter(p => p.reviewTimeHrs).map(p => p.reviewTimeHrs!)))
  const avgMergeDelay = round(avg(prs.filter(p => p.mergeDelayHrs).map(p => p.mergeDelayHrs!)))

  // Reviewer workload
  const reviewerMap: Record<string, number> = {}
  const allReviews = await prisma.pullRequestReview.findMany({
    where: { pr: { repo: { orgId: org.id } } },
  })
  for (const r of allReviews) {
    reviewerMap[r.reviewerLogin] = (reviewerMap[r.reviewerLogin] ?? 0) + 1
  }
  const topReviewers = Object.entries(reviewerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Pull Requests</h1>
        <p className="text-gray-500 text-sm mt-0.5">Cycle times and review analytics</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Merged PRs', value: prs.length },
          { label: 'Avg Cycle Time', value: avgCycleTime ? `${avgCycleTime}h` : '—' },
          { label: 'Repos Tracked', value: new Set(prs.map(pr => pr.repoId)).size },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">{s.label}</p>
            <p className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Cycle Time Breakdown */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 mb-6">
        <p className="text-sm font-medium mb-1">Cycle Time Breakdown</p>
        <p className="text-xs text-gray-500 mb-5">Average time spent in each stage across all merged PRs</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Coding Time', value: avgCodingTime, desc: 'First commit → PR opened', color: 'blue' },
            { label: 'Review Wait', value: avgReviewWait, desc: 'PR opened → first review', color: 'yellow' },
            { label: 'Review Time', value: avgReviewTime, desc: 'First review → approved', color: 'purple' },
            { label: 'Merge Delay', value: avgMergeDelay, desc: 'Approved → merged', color: 'green' },
          ].map((s) => (
            <div key={s.label} className={`border rounded-xl p-4 ${
              s.color === 'blue' ? 'border-blue-500/20 bg-blue-500/[0.03]' :
              s.color === 'yellow' ? 'border-yellow-500/20 bg-yellow-500/[0.03]' :
              s.color === 'purple' ? 'border-purple-500/20 bg-purple-500/[0.03]' :
              'border-emerald-500/20 bg-emerald-500/[0.03]'
            }`}>
              <p className="text-xs text-gray-500 mb-2">{s.label}</p>
              <p className="text-2xl font-bold mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {s.value ? `${s.value}h` : '—'}
              </p>
              <p className="text-xs text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Reviewer Workload */}
        <div className="col-span-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <p className="text-sm font-medium mb-1">Top Reviewers</p>
          <p className="text-xs text-gray-500 mb-4">Reviews submitted</p>
          {topReviewers.length === 0 ? (
            <p className="text-xs text-gray-600">No review data yet</p>
          ) : topReviewers.map(([login, count]) => (
            <div key={login} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-sm text-gray-300">{login}</span>
              <span className="text-xs font-mono text-gray-500">{count} reviews</span>
            </div>
          ))}
        </div>

        {/* PR Size Analysis */}
        <div className="col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <p className="text-sm font-medium mb-1">PR Size Analysis</p>
          <p className="text-xs text-gray-500 mb-4">Large PRs take longer to review and have more bugs</p>
          <div className="space-y-2">
            {[
              { label: 'Small (< 100 lines)', filter: (p: any) => (p.additions + p.deletions) < 100, color: 'emerald' },
              { label: 'Medium (100–400 lines)', filter: (p: any) => (p.additions + p.deletions) >= 100 && (p.additions + p.deletions) < 400, color: 'yellow' },
              { label: 'Large (> 400 lines)', filter: (p: any) => (p.additions + p.deletions) >= 400, color: 'red' },
            ].map((bucket) => {
              const count = prs.filter(bucket.filter).length
              const pct = prs.length > 0 ? Math.round((count / prs.length) * 100) : 0
              return (
                <div key={bucket.label}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{bucket.label}</span>
                    <span>{count} PRs ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      bucket.color === 'emerald' ? 'bg-emerald-500' :
                      bucket.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* PR Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06]">
          {['Title', 'Author', 'Repo', '+/−', 'Cycle Time'].map((h, i) => (
            <div key={h} className={`text-xs uppercase tracking-widest text-gray-600 ${
              i === 0 ? 'col-span-4' : i === 3 ? 'col-span-2 text-right' : i === 4 ? 'col-span-2 text-right' : 'col-span-2'
            }`}>{h}</div>
          ))}
        </div>
        {prs.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-600 text-sm">No merged PRs found. Sync your GitHub data.</div>
        ) : prs.map((pr) => (
          <div key={pr.id} className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-all">
            <div className="col-span-4 text-sm truncate text-gray-200">{pr.title}</div>
            <div className="col-span-2 text-sm text-gray-500">{pr.authorLogin}</div>
            <div className="col-span-2 text-sm text-gray-500 truncate">{pr.repo.name}</div>
            <div className="col-span-2 text-right text-xs">
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