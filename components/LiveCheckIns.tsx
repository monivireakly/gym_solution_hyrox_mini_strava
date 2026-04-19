'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { avatarEmoji, avatarColor } from '@/lib/avatar'
import { calcStats } from '@/lib/stats'

type Entry = {
  id: string
  name: string
  emoji: string
  color: string
  streak: number
  at: Date
  fresh: boolean
}

export default function LiveCheckIns() {
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    // Load last 4 check-ins on mount
    async function loadRecent() {
      const { data } = await supabase
        .from('attendance')
        .select('id, member_id, checked_in_at, members!inner(name)')
        .order('checked_in_at', { ascending: false })
        .limit(4)

      if (!data) return
      const items: Entry[] = data.map(r => {
        const name = (r.members as unknown as { name: string }).name
        return { id: r.id, name, emoji: avatarEmoji(name), color: avatarColor(name), streak: 0, at: new Date(r.checked_in_at), fresh: false }
      })
      setEntries(items)
    }
    loadRecent()

    // Subscribe to new check-ins
    const channel = supabase
      .channel('tv-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, async (payload) => {
        const memberId = payload.new.member_id

        const [{ data: member }, { data: history }] = await Promise.all([
          supabase.from('members').select('name').eq('id', memberId).single(),
          supabase.from('attendance').select('checked_in_at').eq('member_id', memberId).order('checked_in_at', { ascending: false }).limit(200),
        ])

        if (!member) return

        const dates = (history ?? []).map(a => new Date(a.checked_in_at))
        const { streak } = calcStats(dates)

        const entry: Entry = {
          id: payload.new.id,
          name: member.name,
          emoji: avatarEmoji(member.name),
          color: avatarColor(member.name),
          streak,
          at: new Date(payload.new.checked_in_at),
          fresh: true,
        }

        setEntries(prev => [entry, ...prev].slice(0, 4))

        // Remove "fresh" highlight after 6s
        setTimeout(() => {
          setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, fresh: false } : e))
        }, 6000)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (entries.length === 0) return null

  return (
    <div className="w-full max-w-md">
      <p className="text-white/25 text-xs font-display uppercase tracking-widest mb-3 text-center">
        Recent check-ins
      </p>
      <div className="flex flex-col gap-2">
        {entries.map((e, i) => (
          <div
            key={e.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-700"
            style={{
              background: e.fresh
                ? `linear-gradient(135deg, ${e.color}30, rgba(0,201,212,0.15))`
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${e.fresh ? 'rgba(0,201,212,0.3)' : 'rgba(255,255,255,0.06)'}`,
              boxShadow: e.fresh ? `0 0 20px ${e.color}25` : 'none',
              opacity: 1 - i * 0.18,
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: e.color, boxShadow: `0 2px 10px ${e.color}50` }}
            >
              {e.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-white text-sm truncate">{e.name}</p>
              <p className="text-white/35 text-xs">
                {e.at.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            {e.streak > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-base">🔥</span>
                <span className="font-display font-bold text-white/80 text-sm">{e.streak}</span>
              </div>
            )}
            {e.fresh && (
              <span className="text-[10px] font-display font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(0,201,212,0.2)', color: '#00C9D4', border: '1px solid rgba(0,201,212,0.3)' }}>
                LIVE
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
