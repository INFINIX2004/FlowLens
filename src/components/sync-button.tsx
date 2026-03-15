'use client'

import { useState } from 'react'

export default function SyncButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function pollStatus(jobId: string) {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/github/sync?jobId=${jobId}`)
      const data = await res.json()
      if (data.status === 'done') {
        setStatus('done')
        clearInterval(interval)
        setTimeout(() => setStatus('idle'), 3000)
      } else if (data.status === 'error') {
        setStatus('error')
        clearInterval(interval)
        setTimeout(() => setStatus('idle'), 3000)
      }
    }, 2000)
  }

  async function handleSync() {
    setStatus('loading')
    try {
      // Start worker
      await fetch('/api/worker')
      // Enqueue sync job
      const res = await fetch('/api/github/sync', { method: 'POST' })
      const data = await res.json()
      if (data.jobId) {
        pollStatus(data.jobId)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={status === 'loading'}
      className={`flex items-center gap-2 text-xs border px-3 py-2 rounded-md transition-all ${
        status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
        status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
        status === 'loading' ? 'bg-white/[0.03] border-white/[0.06] text-gray-500' :
        'bg-white/[0.05] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]'
      }`}
    >
      <span className={status === 'loading' ? 'animate-spin inline-block' : ''}>↻</span>
      {status === 'loading' ? 'Syncing...' : status === 'done' ? 'Synced!' : status === 'error' ? 'Failed' : 'Sync'}
    </button>
  )
}