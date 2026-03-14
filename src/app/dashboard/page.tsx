import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getGithubRepos } from '@/lib/github'
import { getDORAMetrics } from '@/lib/metrics'

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: user.id } })

  const [repos, metrics] = await Promise.all([
    org?.githubAccessToken ? getGithubRepos(org.githubAccessToken) : [],
    org ? getDORAMetrics(org.id) : null,
  ])

  const doraCards = [
    { label: 'Deployment Freq', value: metrics?.deployFrequency ?? null, unit: '/ week', good: (v: number) => v >= 3, description: 'Releases per week' },
    { label: 'Lead Time', value: metrics?.leadTime ?? null, unit: 'hrs', good: (v: number) => v <= 24, description: 'Commit to production' },
    { label: 'Failure Rate', value: metrics?.changeFailureRate ?? null, unit: '%', good: (v: number) => v <= 15, description: 'Failed deployments' },
    { label: 'MTTR', value: metrics?.mttr ?? null, unit: 'hrs', good: (v: number) => v <= 1, description: 'Mean time to restore' },
  ]

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <form action="/api/github/sync" method="POST">
          <button className="flex items-center gap-2 text-xs bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 px-3 py-2 rounded-md transition">
            <span>↻</span> Sync
          </button>
        </form>
      </div>

      {/* DORA Cards */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {doraCards.map((m) => {
          const hasValue = m.value !== null
          const isGood = hasValue && m.good(m.value as number)
          return (
            <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest">{m.label}</p>
                {hasValue && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isGood ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isGood ? '↑ good' : '↓ low'}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {hasValue ? m.value : <span className="text-gray-700">—</span>}
              </p>
              <p className="text-xs text-gray-600">{hasValue ? m.unit : m.description}</p>
            </div>
          )
        })}
      </div>

      {/* Stats row */}
      {metrics && (
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
      )}

      {/* Repos */}
      {!org?.githubAccessToken ? (
        <div className="border border-dashed border-white/10 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🔗</p>
          <h2 className="text-lg font-medium mb-2">Connect GitHub</h2>
          <p className="text-gray-500 text-sm mb-6">Link your repos to start seeing metrics.</p>
          <a href="/api/github/connect">
            <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
              Connect GitHub
            </button>
          </a>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">Repositories</h2>
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
      )}
    </div>
  )
}