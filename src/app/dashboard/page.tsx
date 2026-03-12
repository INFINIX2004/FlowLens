import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getGithubRepos } from '@/lib/github'
import { getDORAMetrics } from '@/lib/metrics'

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: user.id },
  })

  const [repos, metrics] = await Promise.all([
    org?.githubAccessToken ? getGithubRepos(org.githubAccessToken) : [],
    org ? getDORAMetrics(org.id) : null,
  ])

  const doraCards = [
    { label: 'Deployment Frequency', value: metrics?.deployFrequency ?? '—', unit: 'per week' },
    { label: 'Lead Time', value: metrics?.leadTime ?? '—', unit: 'hours' },
    { label: 'Change Failure Rate', value: metrics?.changeFailureRate ?? '—', unit: '%' },
    { label: 'MTTR', value: metrics?.mttr ?? '—', unit: 'hours' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">⚡ FlowLens</h1>
            <p className="text-gray-400 mt-1">Welcome back, {user.firstName ?? user.username}</p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <form action="/api/github/sync" method="POST" className="mb-6">
          <button type="submit" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
            ↻ Sync GitHub Data
          </button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {doraCards.map((m) => (
            <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{m.label}</p>
              <p className="text-4xl font-bold">{m.value}</p>
              <p className="text-gray-500 text-sm mt-1">{m.unit}</p>
            </div>
          ))}
        </div>

        {!org?.githubAccessToken ? (
          <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">🔗</div>
            <h2 className="text-xl font-semibold mb-2">Connect your GitHub</h2>
            <p className="text-gray-400 mb-6">Link your repos to start seeing metrics.</p>
            <a href="/api/github/connect">
              <button className="bg-white text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition">
                Connect GitHub
              </button>
            </a>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Repositories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.map((repo: any) => (
                <div key={repo.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{repo.name}</p>
                      <p className="text-gray-400 text-sm mt-1">{repo.description ?? 'No description'}</p>
                    </div>
                    <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                      {repo.language ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-4 text-xs text-gray-500">
                    <span>⭐ {repo.stargazers_count}</span>
                    <span>🍴 {repo.forks_count}</span>
                    <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}