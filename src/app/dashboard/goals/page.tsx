'use client'
import { useState, useEffect } from 'react'

const FIELDS = [
  { key: 'deployFrequency', label: 'Deploy Frequency', unit: '/ week', higherIsBetter: true },
  { key: 'leadTime', label: 'Lead Time', unit: 'hrs', higherIsBetter: false },
  { key: 'changeFailureRate', label: 'Change Failure Rate', unit: '%', higherIsBetter: false },
  { key: 'mttr', label: 'MTTR', unit: 'hrs', higherIsBetter: false },
  { key: 'avgCycleTime', label: 'Avg Cycle Time', unit: 'hrs', higherIsBetter: false },
]

export default function GoalsPage() {
  const [goals, setGoals] = useState<Record<string, string>>({})
  const [actuals, setActuals] = useState<Record<string, number | null>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/goals').then(r => r.json()).then(d => {
      if (d.goals) setGoals(Object.fromEntries(Object.entries(d.goals).filter(([k]) => k !== 'id' && k !== 'orgId' && k !== 'createdAt' && k !== 'updatedAt').map(([k, v]) => [k, v != null ? String(v) : ''])))
    })
    fetch('/api/metrics/dora').then(r => r.json()).then(d => setActuals(d))
  }, [])

  async function handleSave() {
    const parsed = Object.fromEntries(Object.entries(goals).map(([k, v]) => [k, v === '' ? null : parseFloat(v)]))
    await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-2">Team Goals</h1>
      <p className="text-gray-500 text-sm mb-8">Set targets and track actual vs goal performance.</p>
      <div className="space-y-3">
        {FIELDS.map(f => {
          const actual = actuals[f.key]
          const target = parseFloat(goals[f.key] ?? '')
          const met = actual != null && !isNaN(target) && (f.higherIsBetter ? actual >= target : actual <= target)
          return (
            <div key={f.key} className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">{f.label}</p>
                {actual != null && <p className="text-xs text-gray-500 mt-0.5">Actual: <span className={met ? 'text-emerald-400' : 'text-yellow-400'}>{actual.toFixed(1)}{f.unit}</span></p>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={goals[f.key] ?? ''}
                  onChange={e => setGoals(g => ({ ...g, [f.key]: e.target.value }))}
                  placeholder="Target"
                  className="w-24 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:border-blue-500/50"
                />
                <span className="text-xs text-gray-600 w-12">{f.unit}</span>
                {actual != null && !isNaN(target) && (
                  <span className={`text-xs w-4 ${met ? 'text-emerald-400' : 'text-red-400'}`}>{met ? '✓' : '✗'}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={handleSave} className="mt-6 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition">
        {saved ? '✓ Saved' : 'Save Goals'}
      </button>
    </div>
  )
}