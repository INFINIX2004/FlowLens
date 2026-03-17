'use client'

import { useState } from 'react'

export default function RetrospectivePage() {
  const [retro, setRetro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setRetro(null)
    setError(null)
    try {
      const res = await fetch('/api/ai/retrospective', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setRetro(data.retrospective)
        setProvider(data.provider)
      }
    } catch {
      setError('Failed to generate. Please try again.')
    }
    setLoading(false)
  }

  const parseLines = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ') || line.startsWith('## ')) {
        return (
          <h3
            key={i}
            className="text-sm font-bold mt-6 mb-2 first:mt-0"
            style={{ color: '#C4B8FF' }}
          >
            {line.replace(/#{2,3} /, '')}
          </h3>
        )
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h3
            key={i}
            className="text-sm font-bold mt-6 mb-2"
            style={{ color: '#C4B8FF' }}
          >
            {line.replace(/\*\*/g, '')}
          </h3>
        )
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <div key={i} className="flex items-start gap-2 mb-1.5">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#7C3AED' }} />
            <p className="text-sm" style={{ color: '#C4B8FF' }}>{line.slice(2)}</p>
          </div>
        )
      }
      if (line.trim() === '') return <div key={i} className="h-2" />
      return (
        <p key={i} className="text-sm mb-1" style={{ color: '#C4B8FF' }}>{line}</p>
      )
    })
  }

  return (
    <div className="p-8" style={{ maxWidth: '800px' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>AI Insights</h1>
        <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>
          AI-written sprint summary from your real metrics
        </p>
      </div>

      {/* Generate Card */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: 'linear-gradient(135deg, #16122A, #1A1630)',
          border: '1px solid #2A2450',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: '#7C3AED22', color: '#A78BFA', border: '1px solid #7C3AED33' }}
          >
            ✦
          </div>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#F0EEFF' }}>
              Sprint Retrospective
            </p>
            <p className="text-sm" style={{ color: '#8B7EC8' }}>
              Generates a sprint retrospective based on your PR cycle times, deployment frequency,
              and failure rates — using your actual data, not templates.
            </p>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: loading
              ? '#2A2450'
              : 'linear-gradient(135deg, #7C3AED, #EC4899)',
            boxShadow: loading ? 'none' : '0 0 20px rgba(124,58,237,0.3)',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <span
            className={loading ? 'animate-spin inline-block' : ''}
            style={{ display: 'inline-block' }}
          >
            {loading ? '⟳' : '✦'}
          </span>
          {loading ? 'Generating...' : 'Generate Retrospective'}
        </button>
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

      {/* Result */}
      {retro && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, #16122A, #1A1630)',
            border: '1px solid #7C3AED33',
            boxShadow: '0 0 40px rgba(124,58,237,0.08)',
          }}
        >
          {/* Provider badge */}
          {provider && (
            <div
              className="flex items-center gap-2 mb-5 pb-4"
              style={{ borderBottom: '1px solid #2A2450' }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: '#7C3AED', boxShadow: '0 0 6px rgba(124,58,237,0.6)' }}
              />
              <span className="text-xs" style={{ color: '#6B5FA0' }}>Generated by</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                style={{ background: '#7C3AED22', color: '#A78BFA', border: '1px solid #7C3AED33' }}
              >
                {provider}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="space-y-0.5">
            {parseLines(retro)}
          </div>

          {/* Regenerate */}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid #2A2450' }}>
            <button
              onClick={generate}
              disabled={loading}
              className="text-xs font-medium transition-all"
              style={{ color: '#6B5FA0' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6B5FA0')}
            >
              ↻ Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}