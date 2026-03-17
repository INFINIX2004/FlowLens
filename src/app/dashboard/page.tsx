import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getDORAMetrics, getPerformanceLevel } from '@/lib/metrics'
import SyncButton from '@/components/sync-button'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })

  if (!org?.githubAccessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg, #7C3AED22, #EC489922)', border: '1px solid #7C3AED44' }}
            >⚡</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0EEFF' }}>Welcome to FlowLens</h1>
            <p className="text-sm leading-relaxed" style={{ color: '#8B7EC8' }}>
              Connect your GitHub to start tracking engineering metrics in under 2 minutes.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { step: '01', title: 'Connect GitHub', desc: 'Link your repos to start pulling PR and deployment data', action: { label: 'Connect GitHub →', href: '/api/github/connect' } },
              { step: '02', title: 'Sync your data', desc: 'Pull in your PRs, commits and releases', action: null },
              { step: '03', title: 'View your metrics', desc: 'See DORA metrics, PR cycle times and AI insights', action: null },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-xl p-5 flex items-start gap-4 transition-all"
                style={{ background: '#16122A', border: '1px solid #2A2450' }}
              >
                <span
                  className="text-xs font-mono px-2 py-1 rounded-md mt-0.5"
                  style={{ background: '#7C3AED22', color: '#A78BFA' }}
                >{s.step}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#F0EEFF' }}>{s.title}</p>
                  <p className="text-xs" style={{ color: '#8B7EC8' }}>{s.desc}</p>
                </div>
                {s.action && (
                  <a href={s.action.href}>
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg transition font-medium text-white"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
                    >
                      {s.action.label}
                    </button>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const metrics = await getDORAMetrics(org.id)

  const repos = await prisma.repository.findMany({
    where: { orgId: org.id },
    include: { _count: { select: { pullRequests: true, deployments: true } } },
    orderBy: { lastSyncedAt: 'desc' },
    take: 6,
  })

  const totalPRs = await prisma.pullRequest.count({ where: { repo: { orgId: org.id } } })
  const totalDeploys = await prisma.deployment.count({ where: { repo: { orgId: org.id } } })
  const openPRs = await prisma.pullRequest.count({ where: { repo: { orgId: org.id }, state: 'open' } })

  const doraCards = [
    { key: 'deployFrequency', label: 'Deploy Frequency', value: metrics.deployFrequency, unit: '/ week', elite: '≥ 7 / week', icon: '🚀', accent: '#7C3AED' },
    { key: 'leadTime', label: 'Lead Time', value: metrics.leadTime, unit: 'hrs', elite: '≤ 24 hrs', icon: '⏱', accent: '#06B6D4' },
    { key: 'changeFailureRate', label: 'Failure Rate', value: metrics.changeFailureRate, unit: '%', elite: '≤ 5%', icon: '🛡', accent: '#EC4899' },
    { key: 'mttr', label: 'MTTR', value: metrics.mttr, unit: 'hrs', elite: '≤ 1 hr', icon: '⚡', accent: '#F59E0B' },
  ]

  const levelConfig = {
    elite: { label: 'Elite', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
    high: { label: 'High', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)' },
    medium: { label: 'Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    low: { label: 'Needs Work', color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  }

  return (
    <div className="p-8" style={{ maxWidth: '1400px' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Overview</h1>
          <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/api/export/pdf">
            <button
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-all font-medium"
              style={{ background: '#16122A', border: '1px solid #2A2450', color: '#C4B8FF' }}
            >
              ↓ Export PDF
            </button>
          </a>
          <SyncButton />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total PRs Tracked', value: totalPRs, icon: '⌥', color: '#7C3AED' },
          { label: 'Open PRs', value: openPRs, icon: '◐', color: '#F59E0B' },
          { label: 'Total Deployments', value: totalDeploys, icon: '↑', color: '#10B981' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-5 py-4 flex items-center justify-between transition-all"
            style={{
              background: 'linear-gradient(135deg, #16122A, #1E1A35)',
              border: '1px solid #2A2450',
              boxShadow: `0 4px 24px rgba(0,0,0,0.3)`,
            }}
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

      {/* DORA Metrics */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8B7EC8' }}>
            DORA Metrics
          </h2>
          <div className="flex-1 h-px" style={{ background: '#2A2450' }} />
          <span className="text-xs" style={{ color: '#4B4272' }}>Industry benchmarks</span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {doraCards.map((m) => {
            const hasValue = m.value !== null
            const level = hasValue ? getPerformanceLevel(m.key, m.value as number) : null
            const lc = level ? levelConfig[level] : null

            return (
              <div
                key={m.key}
                className="rounded-2xl p-5 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #16122A 0%, #1E1A35 100%)',
                  border: `1px solid #2A2450`,
                  boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${m.accent}22`, color: m.accent }}
                  >
                    {m.icon}
                  </div>
                  {lc && (
                    <span
                      className="text-xs px-2 py-1 rounded-full font-semibold"
                      style={{ background: lc.bg, color: lc.color, border: `1px solid ${lc.border}` }}
                    >
                      {lc.label}
                    </span>
                  )}
                </div>

                <p className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#6B5FA0' }}>
                  {m.label}
                </p>

                <div className="flex items-baseline gap-1.5 mb-4">
                  <p className="text-4xl font-bold" style={{ color: '#F0EEFF', fontFamily: 'monospace' }}>
                    {hasValue
                      ? ((m.value as number) % 1 === 0 ? m.value : (m.value as number).toFixed(1))
                      : <span style={{ color: '#4B4272', fontSize: '1.5rem' }}>—</span>}
                  </p>
                  {hasValue && (
                    <span className="text-sm" style={{ color: '#8B7EC8' }}>{m.unit}</span>
                  )}
                </div>

                <div className="pt-3" style={{ borderTop: '1px solid #2A2450' }}>
                  <p className="text-xs" style={{ color: '#4B4272' }}>
                    Elite: <span style={{ color: '#6B5FA0' }}>{m.elite}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Repositories */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8B7EC8' }}>
            Repositories
          </h2>
          <div className="flex-1 h-px" style={{ background: '#2A2450' }} />
          <span className="text-xs" style={{ color: '#4B4272' }}>{repos.length} connected</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="rounded-xl p-5 transition-all group cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #16122A, #1A1630)',
                border: '1px solid #2A2450',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: '#7C3AED22', color: '#A78BFA', border: '1px solid #7C3AED33' }}
                  >
                    ⬡
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F0EEFF' }}>{repo.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B5FA0' }}>
                      {repo.lastSyncedAt
                        ? `Synced ${new Date(repo.lastSyncedAt).toLocaleDateString()}`
                        : 'Not synced yet'}
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#06B6D422', color: '#67E8F9', border: '1px solid #06B6D433' }}
                >
                  {repo.fullName.split('/')[0]}
                </span>
              </div>

              <div
                className="flex items-center gap-5 pt-3"
                style={{ borderTop: '1px solid #2A2450' }}
              >
                <div>
                  <p className="text-xs mb-0.5" style={{ color: '#4B4272' }}>PRs</p>
                  <p className="text-sm font-bold" style={{ color: '#F0EEFF' }}>{repo._count.pullRequests}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: '#4B4272' }}>Deploys</p>
                  <p className="text-sm font-bold" style={{ color: '#F0EEFF' }}>{repo._count.deployments}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }}
                  />
                  <span className="text-xs font-medium" style={{ color: '#10B981' }}>Active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}