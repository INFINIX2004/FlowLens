'use client'

import { useState, useEffect } from 'react'

const ALL_EVENTS = [
  {
    id: 'pr_merged',
    label: 'PR Merged',
    desc: 'Fires whenever a PR is merged',
    icon: '⌥',
    color: '#7C3AED',
  },
  {
    id: 'cycle_time_exceeded',
    label: 'Cycle Time Exceeded',
    desc: 'Fires when a PR cycle time exceeds 48 hours',
    icon: '⏱',
    color: '#F59E0B',
  },
  {
    id: 'daily_digest',
    label: 'Daily Digest',
    desc: 'Summary posted every day at 9am UTC',
    icon: '📊',
    color: '#06B6D4',
  },
]

export default function SettingsPage() {
  const [botToken, setBotToken] = useState('')
  const [channel, setChannel] = useState('')
  const [events, setEvents] = useState<string[]>(['pr_merged'])
  const [connected, setConnected] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/slack/config')
      .then(r => r.json())
      .then(d => {
        if (d.config) {
          setChannel(d.config.channel ?? '')
          setEvents(d.config.events ?? [])
          setConnected(true)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!botToken && !connected) return
    setStatus('saving')
    try {
      const res = await fetch('/api/slack/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, channel, events }),
      })
      if (!res.ok) throw new Error('Failed')
      setConnected(true)
      setBotToken('')
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  async function handleDisconnect() {
    await fetch('/api/slack/config', { method: 'DELETE' })
    setConnected(false)
    setChannel('')
    setEvents(['pr_merged'])
    setBotToken('')
  }

  function toggleEvent(id: string) {
    setEvents(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-8" style={{ color: '#F0EEFF' }}>Settings</h1>
        <div
          className="rounded-2xl p-6 animate-pulse"
          style={{ background: '#16122A', border: '1px solid #2A2450', height: '400px' }}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8" style={{ maxWidth: '700px' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>
          Configure notifications and integrations for your team
        </p>
      </div>

      {/* Slack Card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, #16122A, #1A1630)',
          border: '1px solid #2A2450',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: '#4A154B44', color: '#E01E5A', border: '1px solid #E01E5A33' }}
            >
              #
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F0EEFF' }}>
                Slack Notifications
              </p>
              <p className="text-xs" style={{ color: '#6B5FA0' }}>
                Send alerts to a Slack channel
              </p>
            </div>
          </div>
          {connected && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }}
              />
              <span className="text-xs font-medium" style={{ color: '#10B981' }}>Connected</span>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* Bot Token */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-widest block mb-2"
              style={{ color: '#8B7EC8' }}
            >
              Bot Token{' '}
              {connected && (
                <span className="normal-case font-normal" style={{ color: '#4B4272' }}>
                  (leave blank to keep existing)
                </span>
              )}
            </label>
            <input
              type="password"
              value={botToken}
              onChange={e => setBotToken(e.target.value)}
              placeholder="xoxb-..."
              className="w-full rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none transition-all"
              style={{
                background: '#1E1A35',
                border: '1px solid #2A2450',
                color: '#F0EEFF',
              }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'}
              onBlur={e => e.target.style.borderColor = '#2A2450'}
            />
            <p className="text-xs mt-1.5" style={{ color: '#4B4272' }}>
            Create a Slack app at{' '}
            <a
              href="https://api.slack.com/apps"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#A78BFA' }}
            >
              api.slack.com/apps
            </a>
            {', add '}
            <code
              className="text-xs px-1 rounded"
              style={{ background: '#7C3AED22', color: '#C4B8FF' }}
            >
              chat:write
            </code>
            {' scope, paste the Bot User OAuth Token.'}
          </p>

          {/* Channel */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-widest block mb-2"
              style={{ color: '#8B7EC8' }}
            >
              Channel
            </label>
            <input
              value={channel}
              onChange={e => setChannel(e.target.value)}
              placeholder="#engineering"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
              style={{
                background: '#1E1A35',
                border: '1px solid #2A2450',
                color: '#F0EEFF',
              }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'}
              onBlur={e => e.target.style.borderColor = '#2A2450'}
            />
          </div>

          {/* Events */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-widest block mb-3"
              style={{ color: '#8B7EC8' }}
            >
              Notify On
            </label>
            <div className="space-y-2">
              {ALL_EVENTS.map(ev => (
                <label
                  key={ev.id}
                  className="flex items-start gap-3 cursor-pointer rounded-xl p-3 transition-all"
                  style={{
                    background: events.includes(ev.id) ? `${ev.color}11` : '#1E1A3544',
                    border: `1px solid ${events.includes(ev.id) ? `${ev.color}33` : '#2A245066'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={events.includes(ev.id)}
                    onChange={() => toggleEvent(ev.id)}
                    className="mt-0.5"
                    style={{ accentColor: ev.color }}
                  />
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: `${ev.color}22`, color: ev.color }}
                  >
                    {ev.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F0EEFF' }}>{ev.label}</p>
                    <p className="text-xs" style={{ color: '#6B5FA0' }}>{ev.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: status === 'saved'
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : status === 'error'
                  ? 'linear-gradient(135deg, #F87171, #EF4444)'
                  : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                boxShadow: status === 'saved'
                  ? '0 0 20px rgba(16,185,129,0.3)'
                  : '0 0 20px rgba(124,58,237,0.3)',
                opacity: status === 'saving' ? 0.7 : 1,
              }}
            >
              {status === 'saving' ? 'Saving...'
                : status === 'saved' ? '✓ Saved'
                : status === 'error' ? 'Error — try again'
                : 'Save Settings'}
            </button>
            {connected && (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: '#F8717111',
                  border: '1px solid #F8717133',
                  color: '#F87171',
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
