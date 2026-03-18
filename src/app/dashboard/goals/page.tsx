'use client'

import { useState, useEffect } from 'react'

const FIELDS = [
  {
    key: 'deployFrequency',
    label: 'Deploy Frequency',
    unit: '/ week',
    higherIsBetter: true,
    icon: '🚀',
    color: '#7C3AED',
    desc: 'How often you deploy to production',
  },
  {
    key: 'leadTime',
    label: 'Lead Time',
    unit: 'hrs',
    higherIsBetter: false,
    icon: '⏱',
    color: '#06B6D4',
    desc: 'Time from commit to production',
  },
  {
    key: 'changeFailureRate',
    label: 'Change Failure Rate',
    unit: '%',
    higherIsBetter: false,
    icon: '🛡',
    color: '#EC4899',
    desc: 'Percentage of deployments causing failures',
  },
  {
    key: 'mttr',
    label: 'MTTR',
    unit: 'hrs',
    higherIsBetter: false,
    icon: '⚡',
    color: '#F59E0B',
    desc: 'Mean time to restore after an incident',
  },
  {
    key: 'avgCycleTime',
    label: 'Avg Cycle Time',
    unit: 'hrs',
    higherIsBetter: false,
    icon: '↻',
    color: '#10B981',
    desc: 'Average PR open to merge time',
  },
]

export default function GoalsPage() {
  const [goals, setGoals] = useState<Record<string, string>>({})
  const [actuals, setActuals] = useState<Record<string, number | null>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/metrics/dora').then(r => r.json()),
    ]).then(([goalsData, doraData]) => {
      if (goalsData.goals) {
        const filtered = Object.fromEntries(
          Object.entries(goalsData.goals)
            .filter(([k]) => !['id', 'orgId', 'createdAt', 'updatedAt'].includes(k))
            .map(([k, v]) => [k, v != null ? String(v) : ''])
        )
        setGoals(filtered)
      }
      setActuals(doraData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    const parsed = Object.fromEntries(
      Object.entries(goals).map(([k, v]) => [k, v === '' ? null : parseFloat(v)])
    )
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0EEFF' }}>Goals</h1>
        <div className="space-y-3 mt-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="rounded-2xl p-5 animate-pulse"
              style={{ background: '#16122A', border: '1px solid #2A2450', height: '88px' }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8" style={{ maxWidth: '800px' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Team Goals</h1>
          <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>
            Set targets and track actual vs goal performance
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: saved
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            boxShadow: saved
              ? '0 0 20px rgba(16,185,129,0.3)'
              : '0 0 20px rgba(124,58,237,0.3)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Goals'}
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {FIELDS.map(f => {
          const actual = actuals[f.key] as number | null
          const target = parseFloat(goals[f.key] ?? '')
          const hasTarget = !isNaN(target) && goals[f.key] !== ''
          const met = actual != null && hasTarget && (
            f.higherIsBetter ? actual >= target : actual <= target
          )
          const pct = actual != null && hasTarget && target > 0
            ? f.higherIsBetter
              ? Math.min((actual / target) * 100, 100)
              : Math.min((target / actual) * 100, 100)
            : 0

          return (
            <div
              key={f.key}
              className="rounded-2xl p-5 transition-all"
              style={{
                background: 'linear-gradient(135deg, #16122A, #1A1630)',
                border: `1px solid ${hasTarget && met ? '#10B98133' : '#2A2450'}`,
                boxShadow: hasTarget && met ? '0 0 20px rgba(16,185,129,0.05)' : 'none',
              }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: `${f.color}22`, color: f.color }}
                >
                  {f.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold" style={{ color: '#F0EEFF' }}>{f.label}</p>
                    {actual != null && hasTarget && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={met
                          ? { background: '#10B98122', color: '#10B981', border: '1px solid #10B98133' }
                          : { background: '#F87171222', color: '#F87171', border: '1px solid #F8717133' }
                        }
                      >
                        {met ? '✓ On target' : '✗ Off target'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-3" style={{ color: '#6B5FA0' }}>{f.desc}</p>

                  {/* Progress bar */}
                  {actual != null && hasTarget && (
                    <div className="mb-3">
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: '#2A2450' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: met
                              ? 'linear-gradient(90deg, #10B981, #059669)'
                              : 'linear-gradient(90deg, #F59E0B, #F87171)',
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs" style={{ color: '#6B5FA0' }}>
                          Actual: <span style={{ color: '#C4B8FF', fontFamily: 'monospace' }}>
                            {actual.toFixed(1)}{f.unit}
                          </span>
                        </span>
                        <span className="text-xs" style={{ color: '#6B5FA0' }}>
                          {Math.round(pct)}% of target
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-[160px]">
                      <input
                        type="number"
                        value={goals[f.key] ?? ''}
                        onChange={e => setGoals(g => ({ ...g, [f.key]: e.target.value }))}
                        placeholder="Set target..."
                        className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none transition-all"
                        style={{
                          background: '#1E1A35',
                          border: '1px solid #2A2450',
                          color: '#F0EEFF',
                        }}
                        onFocus={e => e.target.style.borderColor = f.color}
                        onBlur={e => e.target.style.borderColor = '#2A2450'}
                      />
                    </div>
                    <span className="text-sm" style={{ color: '#6B5FA0' }}>{f.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}