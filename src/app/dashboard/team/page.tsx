'use client'

import { useState, useEffect } from 'react'

type Member = {
  id: string
  clerkUserId: string
  role: string
  name: string | null
  email: string | null
  createdAt: string
}

type Invite = {
  id: string
  email: string
  role: string
  createdAt: string
  expiresAt: string
}

const roleColors: Record<string, { bg: string; color: string; border: string }> = {
  owner: { bg: '#F59E0B22', color: '#F59E0B', border: '#F59E0B33' },
  admin: { bg: '#7C3AED22', color: '#A78BFA', border: '#7C3AED33' },
  member: { bg: '#06B6D422', color: '#67E8F9', border: '#06B6D433' },
}

const avatarColors = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EC4899']

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/team/members')
      .then(r => r.json())
      .then(d => {
        setMembers(d.members ?? [])
        setInvites(d.invites ?? [])
        setOrgName(d.orgName ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleInvite() {
    if (!email) return
    setInviting(true)
    setInviteResult(null)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (data.error) {
        setInviteResult(`Error: ${data.error}`)
      } else {
        setInviteResult(data.inviteUrl)
        setEmail('')
        // Refresh list
        const updated = await fetch('/api/team/members').then(r => r.json())
        setInvites(updated.invites ?? [])
      }
    } catch {
      setInviteResult('Error: Failed to send invite')
    }
    setInviting(false)
  }

  async function handleCancelInvite(inviteId: string) {
    await fetch('/api/team/invite', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    })
    setInvites(prev => prev.filter(i => i.id !== inviteId))
  }

  async function handleRemoveMember(memberId: string) {
    await fetch('/api/team/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  async function copyInviteLink(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-8" style={{ color: '#F0EEFF' }}>Team</h1>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl h-16 animate-pulse"
              style={{ background: '#16122A', border: '1px solid #2A2450' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8" style={{ maxWidth: '800px' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F0EEFF' }}>Team</h1>
        <p className="text-sm mt-1" style={{ color: '#6B5FA0' }}>
          Manage members and invitations for <span style={{ color: '#A78BFA' }}>{orgName}</span>
        </p>
      </div>

      {/* Invite Card */}
      <div className="rounded-2xl p-6 mb-6"
        style={{ background: 'linear-gradient(135deg, #16122A, #1A1630)', border: '1px solid #2A2450' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#F0EEFF' }}>Invite a team member</p>
        <p className="text-xs mb-4" style={{ color: '#6B5FA0' }}>
          They will receive a link to join your FlowLens workspace
        </p>

        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
            style={{ background: '#1E1A35', border: '1px solid #2A2450', color: '#F0EEFF' }}
            onFocus={e => { e.target.style.borderColor = '#7C3AED' }}
            onBlur={e => { e.target.style.borderColor = '#2A2450' }}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ background: '#1E1A35', border: '1px solid #2A2450', color: '#F0EEFF' }}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting || !email}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              boxShadow: '0 0 20px rgba(124,58,237,0.3)',
              opacity: inviting || !email ? 0.6 : 1,
            }}
          >
            {inviting ? '...' : 'Invite'}
          </button>
        </div>

        {/* Invite Result */}
        {inviteResult && (
          <div className="mt-4 p-3 rounded-xl" style={{
            background: inviteResult.startsWith('Error') ? '#F8717122' : '#10B98122',
            border: `1px solid ${inviteResult.startsWith('Error') ? '#F8717133' : '#10B98133'}`,
          }}>
            {inviteResult.startsWith('Error') ? (
              <p className="text-sm" style={{ color: '#F87171' }}>{inviteResult}</p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: '#10B981' }}>
                    ✓ Invite link generated
                  </p>
                  <p className="text-xs font-mono truncate" style={{ color: '#6B5FA0' }}>
                    {inviteResult}
                  </p>
                </div>
                <button
                  onClick={() => copyInviteLink(inviteResult)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
                  style={{ background: '#10B98122', color: '#10B981', border: '1px solid #10B98133' }}
                >
                  {copied ? '✓ Copied' : 'Copy link'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Members List */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #2A2450' }}>
        <div className="px-6 py-4" style={{ background: '#16122A', borderBottom: '1px solid #2A2450' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4B4272' }}>
            Members — {members.length}
          </p>
        </div>
        {members.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm" style={{ color: '#4B4272' }}>No members yet. Invite your team above.</p>
          </div>
        ) : members.map((member, i) => {
          const rc = roleColors[member.role] ?? roleColors.member
          return (
            <div key={member.id}
              className="flex items-center gap-4 px-6 py-4 transition-all"
              style={{ borderBottom: '1px solid #2A245044', background: i % 2 === 0 ? 'transparent' : '#16122A44' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: avatarColors[i % avatarColors.length] }}
              >
                {(member.name ?? member.email ?? member.clerkUserId).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#F0EEFF' }}>
                  {member.name ?? member.email ?? member.clerkUserId}
                </p>
                {member.email && (
                  <p className="text-xs truncate" style={{ color: '#6B5FA0' }}>{member.email}</p>
                )}
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                {member.role}
              </span>
              {member.role !== 'owner' && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: '#F8717111', color: '#F87171', border: '1px solid #F8717133' }}
                >
                  Remove
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A2450' }}>
          <div className="px-6 py-4" style={{ background: '#16122A', borderBottom: '1px solid #2A2450' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4B4272' }}>
              Pending Invites — {invites.length}
            </p>
          </div>
          {invites.map((invite, i) => (
            <div key={invite.id}
              className="flex items-center gap-4 px-6 py-4"
              style={{ borderBottom: '1px solid #2A245044', background: i % 2 === 0 ? 'transparent' : '#16122A44' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B33' }}
              >
                ✉
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#F0EEFF' }}>{invite.email}</p>
                <p className="text-xs" style={{ color: '#6B5FA0' }}>
                  Expires {new Date(invite.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B33' }}>
                Pending
              </span>
              <button
                onClick={() => handleCancelInvite(invite.id)}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: '#F8717111', color: '#F87171', border: '1px solid #F8717133' }}
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}