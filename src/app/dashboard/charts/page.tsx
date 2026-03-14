'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ChartsPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/metrics/trends').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Trends</h1>
        <p className="text-gray-500 text-sm mt-0.5">Loading...</p>
      </div>
    </div>
  )

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' },
    labelStyle: { color: '#6b7280' },
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Trends</h1>
        <p className="text-gray-500 text-sm mt-0.5">Metrics over time</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          {
            title: 'Lead Time Trend',
            subtitle: 'Hours from commit to merge',
            chart: (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.leadTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#374151" tick={{ fontSize: 10, fill: '#4b5563' }} />
                  <YAxis stroke="#374151" tick={{ fontSize: 10, fill: '#4b5563' }} unit="h" />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )
          },
          {
            title: 'Deployments per Week',
            subtitle: 'Release cadence over time',
            chart: (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.deployFrequency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" stroke="#374151" tick={{ fontSize: 10, fill: '#4b5563' }} />
                  <YAxis stroke="#374151" tick={{ fontSize: 10, fill: '#4b5563' }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="deployments" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          },
          {
            title: 'PR Cycle Time Distribution',
            subtitle: 'Time buckets across all PRs',
            chart: (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.cycleTimeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="range" stroke="#374151" tick={{ fontSize: 10, fill: '#4b5563' }} />
                  <YAxis stroke="#374151" tick={{ fontSize: 10, fill: '#4b5563' }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          },
          {
            title: 'Change Failure Rate',
            subtitle: 'Failed deploys % per week',
            chart: (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.failureRateTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" stroke="#374151" tick={{ fontSize: 10, fill: '#4b5563' }} />
                  <YAxis stroke="#374151" tick={{ fontSize: 10, fill: '#4b5563' }} unit="%" />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )
          },
        ].map((card) => (
          <div key={card.title} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 hover:border-white/[0.10] transition-all">
            <p className="text-sm font-medium text-gray-200 mb-0.5">{card.title}</p>
            <p className="text-xs text-gray-600 mb-5">{card.subtitle}</p>
            {card.chart}
          </div>
        ))}
      </div>
    </div>
  )
}