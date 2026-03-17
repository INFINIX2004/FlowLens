import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

type PullRequestWithRepo = {
  id: string
  repoId: string
  title: string
  authorLogin: string
  additions: number
  deletions: number
  cycleTimeHrs: number | null
  codingTimeHrs: number | null
  reviewWaitHrs: number | null
  reviewTimeHrs: number | null
  mergeDelayHrs: number | null
  mergedAt: Date | null
  repo: { name: string }
}

export default async function PRsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) redirect('/dashboard')

  const prs: PullRequestWithRepo[] = await prisma.pullRequest.findMany({
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

  const reviewerMap: Record<string, number> = {}
  const allReviews = await prisma.pullRequestReview.findMany({
    where: { pr: { repo: { orgId: org.id } } },
    select: { reviewerLogin: true },
  })
  for (const r of allReviews) {
    reviewerMap[r.reviewerLogin] = (reviewerMap[r.reviewerLogin] ?? 0) + 1
  }
  const topReviewers = Object.entries(reviewerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const avatarColors = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EC4899']

  return (
    <div className="p-4 md:p-8" style={{ maxWidth: '1400px' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Pull Requests</h1>
        <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>Cycle times and review analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Merged PRs', value: prs.length, icon: '⌥', color: '#7C3AED' },
          { label: 'Avg Cycle Time', value: avgCycleTime ? `${avgCycleTime}h` : '—', icon: '⏱', color: '#06B6D4' },
          { label: 'Repos Tracked', value: new Set(prs.map(pr => pr.repoId)).size, icon: '⬡', color: '#10B981' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-5 py-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #16122A, #1E1A35)', border: '1px solid #2A2450' }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#6B5FA0' }}>
                {s.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: '#F0EEFF', fontFamily: 'monospace' }}>
                {s.value}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${s.color}22`, color: s.color }}
            >
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Cycle Time Breakdown */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: '#16122A', border: '1px solid #2A2450' }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: '#F0EEFF' }}>Cycle Time Breakdown</p>
        <p className="text-xs mb-5" style={{ color: '#6B5FA0' }}>
          Average time spent in each stage across all merged PRs
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Coding Time', value: avgCodingTime, desc: 'First commit → PR opened', color: '#7C3AED', bg: '#7C3AED22', border: '#7C3AED33' },
            { label: 'Review Wait', value: avgReviewWait, desc: 'PR opened → first review', color: '#F59E0B', bg: '#F59E0B22', border: '#F59E0B33' },
            { label: 'Review Time', value: avgReviewTime, desc: 'First review → approved', color: '#EC4899', bg: '#EC489922', border: '#EC489933' },
            { label: 'Merge Delay', value: avgMergeDelay, desc: 'Approved → merged', color: '#10B981', bg: '#10B98122', border: '#10B98133' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: s.color }}>{s.label}</p>
              <p className="text-2xl font-bold mb-1" style={{ color: '#F0EEFF', fontFamily: 'monospace' }}>
                {s.value ? `${s.value}h` : '—'}
              </p>
              <p className="text-xs" style={{ color: '#6B5FA0' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Top Reviewers */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#16122A', border: '1px solid #2A2450' }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: '#F0EEFF' }}>Top Reviewers</p>
          <p className="text-xs mb-4" style={{ color: '#6B5FA0' }}>Reviews submitted</p>
          {topReviewers.length === 0 ? (
            <p className="text-xs" style={{ color: '#4B4272' }}>No review data yet</p>
          ) : topReviewers.map(([login, count], i) => (
            <div
              key={login}
              className="flex items-center gap-3 py-2"
              style={{ borderBottom: '1px solid #2A245066' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: avatarColors[i % avatarColors.length] }}
              >
                {login.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm flex-1 truncate" style={{ color: '#C4B8FF' }}>{login}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#7C3AED22', color: '#A78BFA' }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>

        {/* PR Size Analysis */}
        <div
          className="col-span-2 rounded-2xl p-5"
          style={{ background: '#16122A', border: '1px solid #2A2450' }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: '#F0EEFF' }}>PR Size Analysis</p>
          <p className="text-xs mb-5" style={{ color: '#6B5FA0' }}>
            Large PRs take longer to review and introduce more bugs
          </p>
          <div className="space-y-4">
            {[
              { label: 'Small', range: '< 100 lines', filter: (p: PullRequestWithRepo) => (p.additions + p.deletions) < 100, color: '#10B981', bg: '#10B98122' },
              { label: 'Medium', range: '100–400 lines', filter: (p: PullRequestWithRepo) => (p.additions + p.deletions) >= 100 && (p.additions + p.deletions) < 400, color: '#F59E0B', bg: '#F59E0B22' },
              { label: 'Large', range: '> 400 lines', filter: (p: PullRequestWithRepo) => (p.additions + p.deletions) >= 400, color: '#F87171', bg: '#F8717122' },
            ].map((bucket) => {
              const count = prs.filter(bucket.filter).length
              const pct = prs.length > 0 ? Math.round((count / prs.length) * 100) : 0
              return (
                <div key={bucket.label}>
                  <div className="flex justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: bucket.bg, color: bucket.color }}
                      >
                        {bucket.label}
                      </span>
                      <span className="text-xs" style={{ color: '#6B5FA0' }}>{bucket.range}</span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: '#C4B8FF' }}>
                      {count} PRs ({pct}%)
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: '#2A2450' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: bucket.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* PR Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #2A2450' }}
      >
        {prs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm" style={{ color: '#4B4272' }}>
              No merged PRs found. Sync your GitHub data.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile PR list */}
            <div className="md:hidden">
              {prs.map((pr) => (
                <div key={pr.id} className="px-4 py-4" style={{ borderBottom: '1px solid #2A245044' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium" style={{ color: '#E0D9FF' }}>{pr.title}</p>
                    <span
                      className="text-xs font-mono px-2 py-1 rounded-lg shrink-0"
                      style={
                        (pr.cycleTimeHrs ?? 0) < 24
                          ? { background: '#10B98122', color: '#10B981' }
                          : (pr.cycleTimeHrs ?? 0) < 48
                          ? { background: '#F59E0B22', color: '#F59E0B' }
                          : { background: '#F8717122', color: '#F87171' }
                      }
                    >
                      {pr.cycleTimeHrs ? `${Math.round(pr.cycleTimeHrs)}h` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: '#8B7EC8' }}>{pr.authorLogin}</span>
                    <span className="text-xs" style={{ color: '#4B4272' }}>·</span>
                    <span className="text-xs" style={{ color: '#8B7EC8' }}>{pr.repo.name}</span>
                    <span className="text-xs ml-auto font-mono">
                      <span style={{ color: '#10B981' }}>+{pr.additions}</span>
                      <span style={{ color: '#4B4272' }}>/</span>
                      <span style={{ color: '#F87171' }}>-{pr.deletions}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <div
                className="grid grid-cols-12 gap-4 px-6 py-3"
                style={{ background: '#16122A', borderBottom: '1px solid #2A2450' }}
              >
                {[
                  { label: 'Title', span: 'col-span-4' },
                  { label: 'Author', span: 'col-span-2' },
                  { label: 'Repo', span: 'col-span-2' },
                  { label: '+/−', span: 'col-span-2 text-right' },
                  { label: 'Cycle Time', span: 'col-span-2 text-right' },
                ].map((h) => (
                  <div
                    key={h.label}
                    className={`text-xs font-semibold uppercase tracking-widest ${h.span}`}
                    style={{ color: '#4B4272' }}
                  >
                    {h.label}
                  </div>
                ))}
              </div>
              {prs.map((pr, i) => (
                <div
                  key={pr.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 transition-all"
                  style={{
                    borderBottom: '1px solid #2A245044',
                    background: i % 2 === 0 ? 'transparent' : '#16122A44',
                  }}
                >
                  <div className="col-span-4 text-sm truncate font-medium" style={{ color: '#E0D9FF' }}>
                    {pr.title}
                  </div>
                  <div className="col-span-2 text-sm truncate" style={{ color: '#8B7EC8' }}>
                    {pr.authorLogin}
                  </div>
                  <div className="col-span-2 text-sm truncate" style={{ color: '#8B7EC8' }}>
                    {pr.repo.name}
                  </div>
                  <div className="col-span-2 text-right text-xs font-mono">
                    <span style={{ color: '#10B981' }}>+{pr.additions}</span>
                    <span style={{ color: '#4B4272', margin: '0 2px' }}>/</span>
                    <span style={{ color: '#F87171' }}>-{pr.deletions}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span
                      className="text-xs font-mono px-2 py-1 rounded-lg"
                      style={
                        (pr.cycleTimeHrs ?? 0) < 24
                          ? { background: '#10B98122', color: '#10B981' }
                          : (pr.cycleTimeHrs ?? 0) < 48
                          ? { background: '#F59E0B22', color: '#F59E0B' }
                          : { background: '#F8717122', color: '#F87171' }
                      }
                    >
                      {pr.cycleTimeHrs ? `${Math.round(pr.cycleTimeHrs)}h` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}