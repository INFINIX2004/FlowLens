'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts'

export default function ChartsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/metrics/trends')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#16122A',
      border: '1px solid #2A2450',
      borderRadius: '12px',
      fontSize: '12px',
      color: '#F0EEFF',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    labelStyle: { color: '#8B7EC8' },
    cursor: { stroke: '#7C3AED44' },
  }

  const axisStyle = {
    stroke: '#2A2450',
    tick: { fontSize: 11, fill: '#6B5FA0' },
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Trends</h1>
          <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>Loading metrics...</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="rounded-2xl p-6 animate-pulse"
              style={{ background: '#16122A', border: '1px solid #2A2450', height: '280px' }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0EEFF' }}>Trends</h1>
        <p className="text-sm" style={{ color: '#F87171' }}>Failed to load metrics. Try syncing first.</p>
      </div>
    )
  }

  const charts = [
    {
      title: 'Lead Time Trend',
      subtitle: 'Hours from commit to merge — daily average',
      color: '#7C3AED',
      gradient: ['#7C3AED', '#EC4899'],
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.leadTimeTrend}>
            <defs>
              <linearGradient id="leadTimeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A245044" vertical={false} />
            <XAxis dataKey="date" {...axisStyle} />
            <YAxis {...axisStyle} unit="h" />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}h`, 'Lead Time']} />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#7C3AED"
              strokeWidth={2}
              fill="url(#leadTimeGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Deployments per Week',
      subtitle: 'Release cadence — weekly totals',
      color: '#06B6D4',
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.deployFrequency}>
            <defs>
              <linearGradient id="deployGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A245044" vertical={false} />
            <XAxis dataKey="week" {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Deployments']} />
            <Bar dataKey="deployments" fill="url(#deployGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'PR Cycle Time Distribution',
      subtitle: 'How fast PRs move through your pipeline',
      color: '#10B981',
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.cycleTimeDistribution}>
            <defs>
              <linearGradient id="cycleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A245044" vertical={false} />
            <XAxis dataKey="range" {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'PRs']} />
            <Bar dataKey="count" fill="url(#cycleGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Change Failure Rate',
      subtitle: 'Deployment failure percentage — by week',
      color: '#F87171',
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.failureRateTrend}>
            <defs>
              <linearGradient id="failureGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A245044" vertical={false} />
            <XAxis dataKey="week" {...axisStyle} />
            <YAxis {...axisStyle} unit="%" />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}%`, 'Failure Rate']} />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#F87171"
              strokeWidth={2}
              fill="url(#failureGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
  ]

  return (
    <div className="p-8" style={{ maxWidth: '1400px' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Trends</h1>
        <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>
          Engineering metrics over time
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-4">
        {charts.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, #16122A, #1A1630)',
              border: '1px solid #2A2450',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F0EEFF' }}>{c.title}</p>
                <p className="text-xs mt-1" style={{ color: '#6B5FA0' }}>{c.subtitle}</p>
              </div>
              <div
                className="w-2 h-2 rounded-full mt-1.5"
                style={{ background: c.color, boxShadow: `0 0 8px ${c.color}88` }}
              />
            </div>
            {c.chart}
          </div>
        ))}
      </div>
    </div>
  )
}