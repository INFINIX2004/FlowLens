import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getGithubRepos } from '@/lib/github'
import { getDORAMetrics, getPerformanceLevel, BENCHMARKS } from '@/lib/metrics'
import { decrypt } from '@/lib/encryption'
import SyncButton from '@/components/sync-button'

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: user.id } })

  // No GitHub connected → show onboarding
  if (!org?.githubAccessToken) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4">⚡</div>
            <h1 className="text-xl font-semibold mb-2">Welcome to FlowLens</h1>
            <p className="text-gray-500 text-sm">Let's get your engineering metrics set up. It takes less than 2 minutes.</p>
          </div>
          <div className="space-y-3">
            {[
              { step: '01', title: 'Connect GitHub', desc: 'Link your repos to start pulling PR and deployment data', action: { label: 'Connect GitHub', href: '/api/github/connect' } },
              { step: '02', title: 'Sync your data', desc: 'Pull in your PRs, commits and releases', action: null },
              { step: '03', title: 'View your metrics', desc: 'See DORA metrics, PR cycle times and AI insights', action: null },
            ].map((s) => (
              <div key={s.step} className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-5 flex items-start gap-4">
                <span className="text-xs font-mono text-gray-600 mt-0.5">{s.step}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-0.5">{s.title}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
                {s.action && (
                  <a href={s.action.href}>
                    <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md transition">
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

  const decryptedToken = decrypt(org.githubAccessToken)

  const [repos, metrics] = await Promise.all([
    getGithubRepos(decryptedToken),
    getDORAMetrics(org.id),
  ])

  const doraCards = [
    { key: 'deployFrequency', label: 'Deployment Freq', value: metrics.deployFrequency, unit: '/ week', benchmark: BENCHMARKS.deployFrequency, higherIsBetter: true },
    { key: 'leadTime', label: 'Lead Time', value: metrics.leadTime, unit: 'hrs', benchmark: BENCHMARKS.leadTime, higherIsBetter: false },
    { key: 'changeFailureRate', label: 'Failure Rate', value: metrics.changeFailureRate, unit: '%', benchmark: BENCHMARKS.changeFailureRate, higherIsBetter: false },
    { key: 'mttr', label: 'MTTR', value: metrics.mttr, unit: 'hrs', benchmark: BENCHMARKS.mttr, higherIsBetter: false },
  ]

  const levelColors = {
    elite: 'text-emerald-400 bg-emerald-500/10',
    high: 'text-blue-400 bg-blue-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    low: 'text-red-400 bg-red-500/10',
  }

  const levelLabels = {
    elite: '⬆ elite',
    high: '↑ high',
    medium: '→ medium',
    low: '↓ low',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/pdf"
            className="flex items-center gap-2 text-xs border border-white/[0.08] bg-white/[0.05] text-gray-300 hover:bg-white/[0.08] px-3 py-2 rounded-md transition-all"
          >
            ↓ Export PDF
          </a>
          <SyncButton />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {doraCards.map((m) => {
          const hasValue = m.value !== null
          const level = hasValue ? getPerformanceLevel(m.key, m.value as number) : null
          return (
            <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest">{m.label}</p>
                {level && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${levelColors[level]}`}>
                    {levelLabels[level]}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {hasValue ? m.value : <span className="text-gray-700">—</span>}
              </p>
              <p className="text-xs text-gray-600 mb-3">{hasValue ? m.unit : 'no data yet'}</p>
              {hasValue && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-700 mb-1">
                    <span>vs industry</span>
                    <span>{m.higherIsBetter ? `elite ≥ ${m.benchmark.elite}` : `elite ≤ ${m.benchmark.elite}`} {m.unit}</span>
                  </div>
                  <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      level === 'elite' ? 'bg-emerald-500' :
                      level === 'high' ? 'bg-blue-500' :
                      level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} style={{
                      width: m.higherIsBetter
                        ? `${Math.min((m.value as number / m.benchmark.elite) * 100, 100)}%`
                        : `${Math.min((m.benchmark.elite / (m.value as number)) * 100, 100)}%`
                    }} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total PRs tracked', value: metrics.totalPRs },
          { label: 'Total deployments', value: metrics.totalDeploys },
          { label: 'Repos connected', value: repos.length },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">{s.label}</span>
            <span className="text-lg font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">Repositories</h2>
        <div className="grid grid-cols-2 gap-3">
          {repos.slice(0, 6).map((repo: any) => (
            <div key={repo.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-all group">
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-sm group-hover:text-blue-400 transition-colors">{repo.name}</p>
                <span className="text-xs bg-white/[0.05] text-gray-400 px-2 py-0.5 rounded-full">{repo.language ?? '—'}</span>
              </div>
              <p className="text-gray-600 text-xs truncate mb-3">{repo.description ?? 'No description'}</p>
              <div className="flex gap-3 text-xs text-gray-600">
                <span>⭐ {repo.stargazers_count}</span>
                <span>🍴 {repo.forks_count}</span>
                <span className="ml-auto">{new Date(repo.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
