'use client'

import { useState, useEffect } from 'react'

type JiraProject = { id: string; key: string; name: string; projectTypeKey: string }
type JiraIssue = {
  id: string
  key: string
  fields: {
    summary: string
    status: { name: string; statusCategory: { colorName: string } }
    issuetype: { name: string; iconUrl: string }
    assignee: { displayName: string; avatarUrls: { '24x24': string } } | null
    priority: { name: string } | null
  }
}

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  'blue-grey': { bg: '#6B7EC822', color: '#8B9EC8', border: '#6B7EC833' },
  'yellow': { bg: '#F59E0B22', color: '#F59E0B', border: '#F59E0B33' },
  'green': { bg: '#10B98122', color: '#10B981', border: '#10B98133' },
  'red': { bg: '#F8717122', color: '#F87171', border: '#F8717133' },
  'default': { bg: '#7C3AED22', color: '#A78BFA', border: '#7C3AED33' },
}

const issueTypeIcons: Record<string, string> = {
  'Bug': '🐛',
  'Story': '📖',
  'Task': '✓',
  'Epic': '⚡',
  'Subtask': '◦',
  'default': '◈',
}

export default function JiraPage() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [siteUrl, setSiteUrl] = useState('')
  const [projects, setProjects] = useState<JiraProject[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [issues, setIssues] = useState<JiraIssue[]>([])
  const [loadingIssues, setLoadingIssues] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/jira/status')
      .then(r => r.json())
      .then(d => {
        setConnected(d.connected)
        setSiteUrl(d.siteUrl ?? '')
        if (d.connected) {
          setLoadingProjects(true)
          fetch('/api/jira/projects')
            .then(r => r.json())
            .then(d => {
              setProjects(d.projects ?? [])
              setLoadingProjects(false)
            })
            .catch(() => setLoadingProjects(false))
        }
      })
      .catch(() => setConnected(false))
  }, [])

  async function loadIssues(projectKey: string) {
    if (!projectKey) return
    setLoadingIssues(true)
    setSelectedProject(projectKey)
    setError(null)
    try {
      const res = await fetch(`/api/jira/issues?project=${projectKey}`)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setIssues([])
      } else {
        setIssues(data.issues ?? [])
      }
    } catch {
      setError('Failed to load issues')
      setIssues([])
    }
    setLoadingIssues(false)
  }

  // Loading state
  if (connected === null) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-8" style={{ color: '#F0EEFF' }}>Integrations</h1>
        <div
          className="rounded-2xl p-6 animate-pulse"
          style={{ background: '#16122A', border: '1px solid #2A2450', height: '200px' }}
        />
      </div>
    )
  }

  // Not connected
  if (!connected) {
    return (
      <div className="p-8" style={{ maxWidth: '700px' }}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Integrations</h1>
          <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>
            Connect external tools to enrich your engineering data
          </p>
        </div>

        {/* Jira Connect Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, #16122A, #1A1630)',
            border: '1px solid #2A2450',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: '#0052CC22', color: '#4C9AFF', border: '1px solid #0052CC33' }}
            >
              ◈
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#F0EEFF' }}>Jira</p>
              <p className="text-sm" style={{ color: '#8B7EC8' }}>
                Link your Atlassian workspace to correlate Jira issues with GitHub PRs.
                Issues mentioned in PR titles (e.g. ENG-123) will be automatically linked.
              </p>
            </div>
          </div>

          <div
            className="rounded-xl p-4 mb-6"
            style={{ background: '#0E0B1E66', border: '1px solid #2A2450' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B4272' }}>
              What you get
            </p>
            <div className="space-y-2">
              {[
                'View Jira issues alongside your GitHub PRs',
                'Auto-link issues mentioned in PR titles',
                'Track issue resolution time',
                'See which PRs are blocked by open tickets',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <span style={{ color: '#10B981' }}>✓</span>
                  <span className="text-sm" style={{ color: '#8B7EC8' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <a href="/api/jira/connect">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #0052CC, #0065FF)',
                boxShadow: '0 0 20px rgba(0,82,204,0.3)',
              }}
            >
              Connect Jira →
            </button>
          </a>
        </div>
      </div>
    )
  }

  // Connected
  return (
    <div className="p-8" style={{ maxWidth: '1400px' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Integrations</h1>
          <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>
            Connected to{' '}
            <span style={{ color: '#4C9AFF' }}>{siteUrl}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }}
          />
          <span className="text-xs font-medium" style={{ color: '#10B981' }}>Jira Connected</span>
        </div>
      </div>

      {/* Project Selector */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: '#16122A', border: '1px solid #2A2450' }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: '#8B7EC8' }}
        >
          Select Project
        </p>
        {loadingProjects ? (
          <div
            className="rounded-xl h-10 animate-pulse"
            style={{ background: '#1E1A35' }}
          />
        ) : (
          <div className="flex items-center gap-3">
            <select
              value={selectedProject}
              onChange={e => loadIssues(e.target.value)}
              className="rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all flex-1 max-w-sm"
              style={{
                background: '#1E1A35',
                border: '1px solid #2A2450',
                color: selectedProject ? '#F0EEFF' : '#6B5FA0',
              }}
            >
              <option value="">Choose a project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.key}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
            {selectedProject && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: '#0052CC22', color: '#4C9AFF', border: '1px solid #0052CC33' }}
              >
                {issues.length} issues
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: '#F8717111', border: '1px solid #F8717133' }}
        >
          <p className="text-sm font-medium" style={{ color: '#F87171' }}>⚠ {error}</p>
        </div>
      )}

      {/* Loading Issues */}
      {loadingIssues && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="rounded-xl h-16 animate-pulse"
              style={{ background: '#16122A', border: '1px solid #2A2450' }}
            />
          ))}
        </div>
      )}

      {/* Issues List */}
      {!loadingIssues && issues.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #2A2450' }}
        >
          {/* Table Header */}
          <div
            className="grid gap-4 px-6 py-3"
            style={{
              gridTemplateColumns: '100px 1fr 140px 120px 100px',
              background: '#16122A',
              borderBottom: '1px solid #2A2450',
            }}
          >
            {['Key', 'Summary', 'Status', 'Assignee', 'Type'].map(h => (
              <p
                key={h}
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#4B4272' }}
              >
                {h}
              </p>
            ))}
          </div>

          {/* Rows */}
          {issues.map((issue, i) => {
            const statusCat = issue.fields.status.statusCategory.colorName
            const sc = statusColors[statusCat] ?? statusColors.default
            const typeIcon = issueTypeIcons[issue.fields.issuetype.name] ?? issueTypeIcons.default

            return (
              <div
                key={issue.id}
                className="grid gap-4 px-6 py-4 transition-all"
                style={{
                  gridTemplateColumns: '100px 1fr 140px 120px 100px',
                  borderBottom: '1px solid #2A245044',
                  background: i % 2 === 0 ? 'transparent' : '#16122A44',
                }}
              >
                {/* Key */}
                <a
                  href={`${siteUrl}/browse/${issue.key}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span
                    className="text-xs font-bold font-mono px-2 py-1 rounded-lg"
                    style={{ background: '#0052CC22', color: '#4C9AFF' }}
                  >
                    {issue.key}
                  </span>
                </a>

                {/* Summary */}
                <p
                  className="text-sm truncate self-center"
                  style={{ color: '#E0D9FF' }}
                >
                  {issue.fields.summary}
                </p>

                {/* Status */}
                <div className="self-center">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                  >
                    {issue.fields.status.name}
                  </span>
                </div>

                {/* Assignee */}
                <p
                  className="text-xs truncate self-center"
                  style={{ color: '#8B7EC8' }}
                >
                  {issue.fields.assignee?.displayName ?? 'Unassigned'}
                </p>

                {/* Type */}
                <div className="flex items-center gap-1.5 self-center">
                  <span>{typeIcon}</span>
                  <span className="text-xs" style={{ color: '#6B5FA0' }}>
                    {issue.fields.issuetype.name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loadingIssues && selectedProject && issues.length === 0 && !error && (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: '#16122A', border: '1px solid #2A2450' }}
        >
          <p className="text-3xl mb-3">◈</p>
          <p className="text-sm font-semibold mb-1" style={{ color: '#F0EEFF' }}>
            No issues found
          </p>
          <p className="text-xs" style={{ color: '#6B5FA0' }}>
            No issues found in project {selectedProject}
          </p>
        </div>
      )}

      {/* No project selected */}
      {!selectedProject && !loadingProjects && (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: '#16122A', border: '1px solid #2A2450' }}
        >
          <p className="text-3xl mb-3">◈</p>
          <p className="text-sm font-semibold mb-1" style={{ color: '#F0EEFF' }}>
            Select a project above
          </p>
          <p className="text-xs" style={{ color: '#6B5FA0' }}>
            Choose a Jira project to view its issues
          </p>
        </div>
      )}
    </div>
  )
}