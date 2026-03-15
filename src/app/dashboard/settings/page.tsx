'use client'

import { useEffect, useState } from 'react'

const ALL_EVENTS = [
  { id: 'pr_merged', label: 'PR Merged', desc: 'Fires whenever a PR is merged' },
  { id: 'cycle_time_exceeded', label: 'Cycle Time Exceeded', desc: 'Fires when cycle time > 48h' },
  { id: 'daily_digest', label: 'Daily Digest', desc: 'Summary posted every day at 9am' },
]

export default function SettingsPage() {
  const [botToken, setBotToken] = useState('')
  const [channel, setChannel] = useState('')
  const [events, setEvents] = useState<string[]>(['pr_merged'])
  const [connected, setConnected] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    fetch('/api/slack/config')
      .then((r) => r.json())
      .then((d) => {
        if (d.config) {
          setChannel(d.config.channel)
          setEvents(d.config.events)
          setConnected(true)
        }
      })
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
      setStatus('saved')
      setBotToken('')
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
  }

  function toggleEvent(id: string) {
    setEvents((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id])
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure Slack notifications for your team.</p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Slack Notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">Send alerts to a Slack channel</p>
          </div>
          {connected && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              ● Connected
            </span>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1.5">
            Bot Token {connected && <span className="text-gray-600 normal-case">(leave blank to keep existing)</span>}
          </label>
          <input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="xoxb-..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 font-mono"
          />
          <p className="text-xs text-gray-600 mt-1">
            Create a Slack app at <span className="text-blue-400">api.slack.com/apps</span>, add the <code className="text-xs bg-white/[0.05] px-1 rounded">chat:write</code> scope, and paste the Bot User OAuth Token.
          </p>
        </div>

        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1.5">Channel</label>
          <input
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="#engineering"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Notify On</label>
          <div className="space-y-2">
            {ALL_EVENTS.map((ev) => (
              <label key={ev.id} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={events.includes(ev.id)}
                  onChange={() => toggleEvent(ev.id)}
                  className="mt-0.5 rounded border-white/20 bg-white/5 accent-blue-500"
                />
                <div>
                  <p className="text-sm text-gray-200">{ev.label}</p>
                  <p className="text-xs text-gray-500">{ev.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={status === 'saving'}
            className={`text-sm px-4 py-2 rounded-lg transition font-medium ${
              status === 'saved' ? 'bg-emerald-600 text-white' :
              status === 'error' ? 'bg-red-600 text-white' :
              'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {status === 'saving' ? 'Saving...' : status === 'saved' ? '✓ Saved' : status === 'error' ? 'Error' : 'Save'}
          </button>
          {connected && (
            <button
              onClick={handleDisconnect}
              className="text-sm px-4 py-2 rounded-lg border border-white/[0.08] text-gray-400 hover:text-red-400 hover:border-red-500/30 transition"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
