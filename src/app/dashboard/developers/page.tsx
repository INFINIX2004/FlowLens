import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function DevelopersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) redirect('/dashboard')

  const prs = await prisma.pullRequest.findMany({
    where: { repo: { orgId: org.id }, mergedAt: { not: null } },
    select: {
      authorLogin: true,
      cycleTimeHrs: true,
      additions: true,
      deletions: true,
      reviewCount: true,
      mergedAt: true,
    },
  })

  const reviews = await prisma.pullRequestReview.findMany({
    where: { pr: { repo: { orgId: org.id } } },
    select: { reviewerLogin: true, state: true },
  })

  // Build developer stats
  const devMap: Record<string, {
    prs: number
    totalCycleTime: number
    cycleCount: number
    additions: number
    deletions: number
    reviews: number
  }> = {}

  for (const pr of prs) {
    if (!devMap[pr.authorLogin]) {
      devMap[pr.authorLogin] = { prs: 0, totalCycleTime: 0, cycleCount: 0, additions: 0, deletions: 0, reviews: 0 }
    }
    devMap[pr.authorLogin].prs++
    devMap[pr.authorLogin].additions += pr.additions
    devMap[pr.authorLogin].deletions += pr.deletions
    if (pr.cycleTimeHrs) {
      devMap[pr.authorLogin].totalCycleTime += pr.cycleTimeHrs
      devMap[pr.authorLogin].cycleCount++
    }
  }

  for (const review of reviews) {
    if (!devMap[review.reviewerLogin]) {
      devMap[review.reviewerLogin] = { prs: 0, totalCycleTime: 0, cycleCount: 0, additions: 0, deletions: 0, reviews: 0 }
    }
    devMap[review.reviewerLogin].reviews++
  }

  const developers = Object.entries(devMap)
    .map(([login, stats]) => ({
      login,
      prs: stats.prs,
      avgCycleTime: stats.cycleCount > 0 ? stats.totalCycleTime / stats.cycleCount : null,
      additions: stats.additions,
      deletions: stats.deletions,
      reviews: stats.reviews,
      linesChanged: stats.additions + stats.deletions,
    }))
    .sort((a, b) => b.prs - a.prs)

  const maxPRs = Math.max(...developers.map(d => d.prs), 1)
  const maxReviews = Math.max(...developers.map(d => d.reviews), 1)

  const avatarColors = [
    '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EC4899',
    '#6366F1', '#14B8A6', '#F97316', '#8B5CF6', '#EF4444',
  ]

  return (
    <div className="p-4 md:p-8" style={{ maxWidth: '1400px' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Developers</h1>
        <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>
          {developers.length} contributors across all repositories
        </p>
      </div>

      {developers.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: '#16122A', border: '1px solid #2A2450' }}
        >
          <p className="text-4xl mb-4">◈</p>
          <p className="text-lg font-semibold mb-2" style={{ color: '#F0EEFF' }}>No developer data yet</p>
          <p className="text-sm" style={{ color: '#6B5FA0' }}>Sync your GitHub repos to see contributor analytics.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Contributors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {developers.slice(0, 3).map((dev, i) => (
              <div
                key={dev.login}
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #16122A, #1E1A35)',
                  border: `1px solid ${i === 0 ? '#F59E0B44' : '#2A2450'}`,
                  boxShadow: i === 0 ? '0 4px 24px rgba(245,158,11,0.1)' : '0 4px 24px rgba(0,0,0,0.3)',
                }}
              >
                {i === 0 && (
                  <div className="absolute top-3 right-3 text-lg">🏆</div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                  >
                    {dev.login.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: '#F0EEFF' }}>{dev.login}</p>
                    <p className="text-xs" style={{ color: '#6B5FA0' }}>
                      #{i + 1} contributor
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'PRs', value: dev.prs },
                    { label: 'Reviews', value: dev.reviews },
                    { label: 'Avg Cycle', value: dev.avgCycleTime ? `${dev.avgCycleTime.toFixed(0)}h` : '—' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-lg font-bold" style={{ color: '#F0EEFF', fontFamily: 'monospace' }}>{s.value}</p>
                      <p className="text-xs" style={{ color: '#4B4272' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Full Table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #2A2450' }}
          >
            {/* Mobile card list */}
            <div className="md:hidden">
              {developers.map((dev, i) => (
                <div key={dev.login} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: '1px solid #2A245044' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: avatarColors[i % avatarColors.length] }}>
                    {dev.login.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#F0EEFF' }}>{dev.login}</p>
                    <p className="text-xs" style={{ color: '#6B5FA0' }}>{dev.prs} PRs · {dev.reviews} reviews</p>
                  </div>
                  <span className="text-xs font-mono" style={{
                    color: dev.avgCycleTime === null ? '#4B4272'
                      : dev.avgCycleTime < 24 ? '#10B981'
                      : dev.avgCycleTime < 48 ? '#F59E0B' : '#F87171'
                  }}>
                    {dev.avgCycleTime ? `${dev.avgCycleTime.toFixed(0)}h` : '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              {/* Table Header */}
              <div
                className="grid gap-4 px-6 py-3"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr 2fr',
                  background: '#16122A',
                  borderBottom: '1px solid #2A2450',
                }}
              >
                {['Developer', 'PRs', 'Reviews', 'Avg Cycle', 'PR Activity', 'Review Load'].map(h => (
                  <p key={h} className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4B4272' }}>{h}</p>
                ))}
              </div>

              {/* Table Rows */}
              {developers.map((dev, i) => (
                <div
                  key={dev.login}
                  className="grid gap-4 px-6 py-4 transition-all"
                  style={{
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr 2fr',
                    borderBottom: '1px solid #2A245066',
                    background: i % 2 === 0 ? 'transparent' : '#16122A44',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: avatarColors[i % avatarColors.length] }}
                    >
                      {dev.login.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: '#F0EEFF' }}>{dev.login}</p>
                  </div>
                  <p className="text-sm font-bold self-center" style={{ color: '#C4B8FF', fontFamily: 'monospace' }}>{dev.prs}</p>
                  <p className="text-sm font-bold self-center" style={{ color: '#C4B8FF', fontFamily: 'monospace' }}>{dev.reviews}</p>
                  <p className="text-sm font-bold self-center" style={{
                    fontFamily: 'monospace',
                    color: dev.avgCycleTime === null ? '#4B4272'
                      : dev.avgCycleTime < 24 ? '#10B981'
                      : dev.avgCycleTime < 48 ? '#F59E0B'
                      : '#F87171',
                  }}>
                    {dev.avgCycleTime ? `${dev.avgCycleTime.toFixed(0)}h` : '—'}
                  </p>
                  <div className="self-center">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#2A2450' }}>
                        <div className="h-full rounded-full" style={{ width: `${(dev.prs / maxPRs) * 100}%`, background: 'linear-gradient(90deg, #7C3AED, #EC4899)' }} />
                      </div>
                      <span className="text-xs w-6 text-right" style={{ color: '#6B5FA0' }}>{dev.prs}</span>
                    </div>
                  </div>
                  <div className="self-center">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#2A2450' }}>
                        <div className="h-full rounded-full" style={{ width: `${(dev.reviews / maxReviews) * 100}%`, background: 'linear-gradient(90deg, #06B6D4, #10B981)' }} />
                      </div>
                      <span className="text-xs w-6 text-right" style={{ color: '#6B5FA0' }}>{dev.reviews}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}