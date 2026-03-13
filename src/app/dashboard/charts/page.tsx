'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

export default function ChartsPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/metrics/trends').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Loading charts...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition">← Back</Link>
          <h1 className="text-2xl font-bold">Trends & Charts</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Lead Time Trend */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-4">Lead Time Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.leadTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Deployment Frequency */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-4">Deployments per Week</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.deployFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="week" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="deployments" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* PR Cycle Time Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-4">PR Cycle Time Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.cycleTimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="range" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Change Failure Rate Trend */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-4">Change Failure Rate Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.failureRateTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="week" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  )
}