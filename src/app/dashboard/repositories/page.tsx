import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

const langColors: Record<string, { bg: string; color: string; border: string }> = {
  TypeScript: { bg: '#3178C622', color: '#60A5FA', border: '#3178C633' },
  JavaScript: { bg: '#F7DF1E22', color: '#FCD34D', border: '#F7DF1E33' },
  Python: { bg: '#3776AB22', color: '#6EE7B7', border: '#3776AB33' },
  Go: { bg: '#00ADD822', color: '#67E8F9', border: '#00ADD833' },
  Rust: { bg: '#CE422B22', color: '#FCA5A5', border: '#CE422B33' },
  Java: { bg: '#ED272422', color: '#FCA5A5', border: '#ED272433' },
  default: { bg: '#7C3AED22', color: '#C4B8FF', border: '#7C3AED33' },
}

export default async function RepositoriesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) redirect('/dashboard')

  const repos = await prisma.repository.findMany({
    where: { orgId: org.id },
    include: {
      _count: { select: { pullRequests: true, deployments: true } },
      pullRequests: {
        where: { mergedAt: { not: null } },
        orderBy: { mergedAt: 'desc' },
        take: 5,
        select: { cycleTimeHrs: true, mergedAt: true },
      },
      deployments: {
        orderBy: { deployedAt: 'desc' },
        take: 10,
        select: { status: true, deployedAt: true },
      },
    },
    orderBy: { lastSyncedAt: 'desc' },
  })

  return (
    <div className="p-8" style={{ maxWidth: '1400px' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Repositories</h1>
          <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>
            {repos.length} repositories connected
          </p>
        </div>
      </div>

      {repos.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: '#16122A', border: '1px solid #2A2450' }}
        >
          <p className="text-4xl mb-4">⬡</p>
          <p className="text-lg font-semibold mb-2" style={{ color: '#F0EEFF' }}>No repositories yet</p>
          <p className="text-sm" style={{ color: '#6B5FA0' }}>Click Sync on the Overview page to import your GitHub repos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {repos.map((repo) => {
            const lang = repo.name
            const lc = langColors[lang] ?? langColors.default
            const avgCycleTime = repo.pullRequests.length > 0
              ? repo.pullRequests.reduce((s, p) => s + (p.cycleTimeHrs ?? 0), 0) / repo.pullRequests.length
              : null
            const failedDeploys = repo.deployments.filter(d => d.status === 'failure').length
            const failureRate = repo.deployments.length > 0
              ? Math.round((failedDeploys / repo.deployments.length) * 100)
              : 0
            const isHealthy = failureRate < 20 && (avgCycleTime === null || avgCycleTime < 48)

            return (
              <div
                key={repo.id}
                className="rounded-2xl p-6 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #16122A, #1A1630)',
                  border: '1px solid #2A2450',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}
              >
                {/* Repo Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: '#7C3AED22', color: '#A78BFA', border: '1px solid #7C3AED33' }}
                    >
                      ⬡
                    </div>
                    <div>
                      <p className="font-bold text-base" style={{ color: '#F0EEFF' }}>{repo.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B5FA0' }}>{repo.fullName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: lc.bg, color: lc.color, border: `1px solid ${lc.border}` }}
                    >
                      {repo.fullName.split('/')[0]}
                    </span>
                    <span
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                      style={isHealthy
                        ? { background: '#10B98122', color: '#10B981', border: '1px solid #10B98133' }
                        : { background: '#F5930B22', color: '#F59E0B', border: '1px solid #F59E0B33' }
                      }
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: isHealthy ? '#10B981' : '#F59E0B',
                          boxShadow: isHealthy ? '0 0 6px rgba(16,185,129,0.6)' : '0 0 6px rgba(245,158,11,0.6)',
                        }}
                      />
                      {isHealthy ? 'Healthy' : 'Needs Attention'}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div
                  className="grid grid-cols-4 gap-3 mb-5 p-4 rounded-xl"
                  style={{ background: '#0E0B1E66', border: '1px solid #2A2450' }}
                >
                  {[
                    { label: 'Total PRs', value: repo._count.pullRequests },
                    { label: 'Deployments', value: repo._count.deployments },
                    { label: 'Avg Cycle', value: avgCycleTime ? `${avgCycleTime.toFixed(1)}h` : '—' },
                    { label: 'Failure Rate', value: `${failureRate}%` },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-xs font-medium mb-1" style={{ color: '#4B4272' }}>{s.label}</p>
                      <p className="text-lg font-bold" style={{ color: '#F0EEFF', fontFamily: 'monospace' }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: '#4B4272' }}>
                    {repo.lastSyncedAt
                      ? `Last synced ${new Date(repo.lastSyncedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'Never synced'}
                  </p>
                  <div className="flex gap-2">
                    {repo.deployments.slice(0, 8).map((d, i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: d.status === 'success' ? '#10B981' : '#F87171',
                          boxShadow: d.status === 'success' ? '0 0 4px rgba(16,185,129,0.5)' : '0 0 4px rgba(248,113,113,0.5)',
                        }}
                        title={`${d.status} — ${new Date(d.deployedAt).toLocaleDateString()}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}