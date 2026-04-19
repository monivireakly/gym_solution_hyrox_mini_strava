'use client'

import { useState, useEffect, useCallback } from 'react'
import Avatar from '@/components/Avatar'
import { isAtRisk } from '@/lib/atrisk'

type Member = {
  id: string
  name: string
  pin: string
  created_at: string
  lastCheckin: string | null
  streak: number
  total: number
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [cardMember, setCardMember] = useState<Member | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/members')
    const data = await res.json()
    setMembers(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  async function deleteMember(id: string) {
    await fetch(`/api/admin/members/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    fetchMembers()
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-4xl text-app-text">Members</h1>
          <p className="text-muted text-sm mt-1">{members.length} total</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-sea text-white font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-sea-dark transition-colors"
        >
          + Add Member
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-sea border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-sea-light overflow-hidden shadow-sm">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>Member</th>
                <th>PIN</th>
                <th>Joined</th>
                <th>Last Check-in</th>
                <th>Streak</th>
                <th>Sessions</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const atRisk = isAtRisk(m.lastCheckin ? new Date(m.lastCheckin) : null)
                return (
                  <tr key={m.id} className={atRisk ? 'bg-amber-50/40' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} size="sm" />
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-muted tracking-[0.3em]">••••</span>
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="text-muted text-sm">
                      {m.lastCheckin
                        ? new Date(m.lastCheckin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : <span className="text-muted/50">Never</span>}
                    </td>
                    <td>
                      <span className="font-display font-semibold text-sea">
                        {m.streak > 0 ? `🔥 ${m.streak}` : '—'}
                      </span>
                    </td>
                    <td className="font-display font-semibold text-sea">{m.total}</td>
                    <td>
                      {atRisk ? (
                        <span className="inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          At risk
                        </span>
                      ) : (
                        <span className="inline-block text-xs bg-sea-light text-sea px-2 py-0.5 rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setCardMember(m)} className="text-muted hover:text-cyan-brand text-sm transition-colors">NFC</button>
                        <button onClick={() => setEditMember(m)} className="text-muted hover:text-sea text-sm transition-colors">Edit</button>
                        <button onClick={() => setDeleteId(m.id)} className="text-muted hover:text-red-500 text-sm transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <MemberModal
          onClose={() => setShowAdd(false)}
          onSave={async (data) => {
            await fetch('/api/admin/members', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            setShowAdd(false)
            fetchMembers()
          }}
        />
      )}

      {/* Edit modal */}
      {editMember && (
        <MemberModal
          initial={editMember}
          onClose={() => setEditMember(null)}
          onSave={async (data) => {
            await fetch(`/api/admin/members/${editMember.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            setEditMember(null)
            fetchMembers()
          }}
        />
      )}

      {/* NFC card-write modal */}
      {cardMember && (
        <NFCCardModal member={cardMember} onClose={() => setCardMember(null)} />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="font-display font-bold text-xl text-app-text mb-2">Delete member?</h2>
            <p className="text-muted text-sm mb-6">This will permanently remove the member and all their attendance records.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-sea-light text-muted font-semibold py-2.5 rounded-xl hover:border-sea transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMember(deleteId)}
                className="flex-1 bg-red-500 text-white font-display font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: { name: string; pin: string }
  onClose: () => void
  onSave: (data: { name: string; pin: string }) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [pin, setPin] = useState(initial?.pin ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || pin.length !== 4) return
    setLoading(true)
    await onSave({ name: name.trim(), pin })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
        <h2 className="font-display font-bold text-xl text-app-text mb-5">
          {initial ? 'Edit Member' : 'Add Member'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-app-text/80 block mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full border-2 border-sea-light rounded-xl px-4 py-3 focus:outline-none focus:border-sea transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-app-text/80 block mb-1.5">PIN (4 digits)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
              className="w-full border-2 border-sea-light rounded-xl px-4 py-3 font-display text-xl tracking-[0.5em] focus:outline-none focus:border-sea transition-colors"
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-sea-light text-muted font-semibold py-2.5 rounded-xl hover:border-sea transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || pin.length !== 4}
              className="flex-1 bg-sea text-white font-display font-semibold py-2.5 rounded-xl hover:bg-sea-dark transition-colors disabled:opacity-40"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NFCCardModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copyId() {
    navigator.clipboard.writeText(member.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-3xl p-7 max-w-sm w-full shadow-2xl animate-scale-in">
        <h2 className="font-display font-bold text-xl text-app-text mb-1">{member.name}</h2>
        <p className="text-muted text-sm mb-5">Write this ID to the member&apos;s NFC card</p>

        {/* ID display */}
        <div className="bg-sea-light rounded-xl p-4 mb-4">
          <p className="text-xs text-muted font-display uppercase tracking-wider mb-2">Member ID (UUID)</p>
          <p className="font-mono text-sm text-sea-dark break-all leading-relaxed select-all">{member.id}</p>
        </div>

        {/* Instructions */}
        <ol className="text-xs text-muted space-y-1.5 mb-5 list-decimal list-inside">
          <li>Open <strong>NFC Tools</strong> (iOS / Android) on your phone</li>
          <li>Tap <strong>Write → Add a record → Text</strong></li>
          <li>Paste the UUID above and save</li>
          <li>Hold phone over NFC card/sticker to write</li>
        </ol>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-sea-light text-muted font-semibold py-2.5 rounded-xl hover:border-sea transition-colors text-sm">
            Close
          </button>
          <button onClick={copyId}
            className="flex-1 bg-sea text-white font-display font-semibold py-2.5 rounded-xl hover:bg-sea-dark transition-colors text-sm">
            {copied ? 'Copied ✓' : 'Copy ID'}
          </button>
        </div>
      </div>
    </div>
  )
}
