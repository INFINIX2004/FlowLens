'use client'
import { useState, useEffect } from 'react'

type JiraIssue = {
  id: string
  key: string
  fields: {
    summary: string
    status: {
      name: string
    }
  }
}

export default function JiraPage() {
  const [issues, setIssues] = useState<JiraIssue[]>([])
  const [connected, setConnected] = useState(false)
  const [projectKey, setProjectKey] = useState('')

  useEffect(() => {
    fetch('/api/jira/status').then(r => r.json()).then(d => setConnected(d.connected))
  }, [])

  async function loadIssues() {
    const res = await fetch(`/api/jira/issues?project=${projectKey}`)
    const data = await res.json()
    setIssues(data.issues ?? [])
  }

  if (!connected) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-3xl mb-4">◈</div>
          <h2 className="text-lg font-semibold mb-2">Connect Jira</h2>
          <p className="text-gray-500 text-sm mb-6">Link your Jira workspace to correlate issues with PRs.</p>
          <a href="/api/jira/connect">
            <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition">
              Connect Jira →
            </button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-6">Jira Issues</h1>
      <div className="flex gap-3 mb-6">
        <input value={projectKey} onChange={e => setProjectKey(e.target.value)}
          placeholder="Project key (e.g. ENG)"
          className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 w-48" />
        <button onClick={loadIssues} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition">
          Load Issues
        </button>
      </div>
      <div className="space-y-2">
        {issues.map((issue) => (
          <div key={issue.id} className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-4 flex items-center gap-4">
            <span className="text-xs font-mono text-blue-400">{issue.key}</span>
            <span className="text-sm flex-1">{issue.fields.summary}</span>
            <span className="text-xs text-gray-500 border border-white/[0.06] px-2 py-0.5 rounded-full">{issue.fields.status.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
