import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">⚡ FlowLens</h1>
            <p className="text-gray-400 mt-1">Welcome back, {user.firstName ?? user.username}</p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* DORA Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Deployment Frequency', value: '—', unit: 'per week', color: 'blue' },
            { label: 'Lead Time', value: '—', unit: 'hours', color: 'purple' },
            { label: 'Change Failure Rate', value: '—', unit: '%', color: 'red' },
            { label: 'MTTR', value: '—', unit: 'hours', color: 'green' },
          ].map((metric) => (
            <div key={metric.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{metric.label}</p>
              <p className="text-4xl font-bold text-white">{metric.value}</p>
              <p className="text-gray-500 text-sm mt-1">{metric.unit}</p>
            </div>
          ))}
        </div>

        {/* Connect GitHub CTA */}
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">🔗</div>
          <h2 className="text-xl font-semibold mb-2">Connect your GitHub organization</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Link your repos to start seeing DORA metrics, PR cycle times, and team insights.
          </p>
          <button className="bg-white text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition">
            Connect GitHub
          </button>
        </div>

      </div>
    </div>
  )
}