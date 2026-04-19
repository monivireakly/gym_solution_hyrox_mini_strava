'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { avatarEmoji, avatarColor } from '@/lib/avatar'
import { calcStats } from '@/lib/stats'

type Entry = {
  id: string
  name: string
  emoji: string
  color: string
  streak: number
  longestStreak: number
  total: number
  consistency: number
  thisWeek: number
  at: Date
  fresh: boolean
  entering: boolean
}

/* Fetch full stats for one member */
async function fetchEntry(memberId: string, checkInId: string, checkedInAt: string): Promise<Entry | null> {
  const [{ data: member }, { data: history }, { data: weekData }] = await Promise.all([
    supabase.from('members').select('name').eq('id', memberId).single(),
    supabase.from('attendance').select('checked_in_at').eq('member_id', memberId).order('checked_in_at', { ascending: false }).limit(365),
    supabase.from('attendance').select('id').eq('member_id', memberId).gte('checked_in_at', getWeekStart()),
  ])

  if (!member) return null

  const dates  = (history ?? []).map(a => new Date(a.checked_in_at))
  const stats  = calcStats(dates)

  return {
    id: checkInId,
    name: member.name,
    emoji: avatarEmoji(member.name),
    color: avatarColor(member.name),
    streak: stats.streak,
    longestStreak: stats.longestStreak,
    total: stats.total,
    consistency: stats.consistency,
    thisWeek: (weekData ?? []).length,
    at: new Date(checkedInAt),
    fresh: false,
    entering: false,
  }
}

function getWeekStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString()
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60)  return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

/* ── Idle placeholder when feed is empty ───────── */
function IdleState() {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex gap-3">
        {['🦁','🐯','🦊','🐺','🦅'].map((e, i) => (
          <div key={e}
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              animation: `tvIdle 2.5s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            {e}
          </div>
        ))}
      </div>
      <p className="text-white/20 text-sm font-display tracking-wide text-center">
        Waiting for check-ins…
      </p>
    </div>
  )
}

/* ── Single check-in card ───────────────────────── */
function CheckInCard({ entry, index }: { entry: Entry; index: number }) {
  const isFirst = index === 0

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-700 ${
        entry.entering ? 'tv-card-enter' : ''
      } ${entry.fresh ? 'tv-border-glow' : ''}`}
      style={{
        animationDelay: entry.entering ? '0ms' : `${index * 80}ms`,
        background: entry.fresh
          ? `linear-gradient(135deg, ${entry.color}28 0%, rgba(0,201,212,0.12) 100%)`
          : undefined,
        borderColor: entry.fresh ? 'rgba(0,201,212,0.35)' : 'rgba(255,255,255,0.07)',
      }}
    >
      {/* Shimmer on older cards */}
      {!entry.fresh && <div className="absolute inset-0 tv-shimmer pointer-events-none" />}

      {/* Glow blob behind avatar */}
      <div
        className="absolute left-3 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-2xl tv-glow-pulse pointer-events-none"
        style={{ background: entry.color }}
      />

      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg tv-emoji-float"
          style={{
            background: entry.color,
            boxShadow: `0 4px 20px ${entry.color}60`,
            animationDelay: `${index * 0.7}s`,
          }}
        >
          {entry.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="font-display font-black text-white text-lg leading-none truncate">
              {entry.name}
            </p>
            {entry.fresh && (
              <div className="relative flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-cyan-brand" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-brand tv-glow-pulse" style={{ filter: 'blur(2px)' }} />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-brand" style={{ animation: 'livePing 1.5s ease-out infinite' }} />
              </div>
            )}
          </div>

          {/* Stats pills */}
          <div className="flex items-center flex-wrap gap-2">
            <StatPill
              icon={<FireIcon />}
              value={entry.streak}
              label="streak"
              highlight={entry.streak >= 7}
              delay={index * 80 + 100}
            />
            <StatPill
              icon="💪"
              value={entry.total}
              label="sessions"
              delay={index * 80 + 180}
            />
            <StatPill
              icon="📊"
              value={`${entry.consistency}%`}
              label="consistent"
              highlight={entry.consistency >= 80}
              delay={index * 80 + 260}
            />
            {entry.thisWeek > 0 && (
              <StatPill
                icon="📅"
                value={entry.thisWeek}
                label="this week"
                delay={index * 80 + 340}
              />
            )}
          </div>
        </div>

        {/* Time + live tag */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {entry.fresh ? (
            <span className="text-[10px] font-display font-black px-2.5 py-1 rounded-full tracking-wider"
              style={{ background: 'rgba(0,201,212,0.2)', color: '#00C9D4', border: '1px solid rgba(0,201,212,0.4)' }}>
              LIVE
            </span>
          ) : (
            <span className="text-white/25 text-xs">{timeAgo(entry.at)}</span>
          )}
          {entry.longestStreak > entry.streak && entry.longestStreak > 0 && (
            <span className="text-white/20 text-[10px]">
              best {entry.longestStreak}d
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function FireIcon() {
  return <span className="tv-fire-wiggle inline-block">🔥</span>
}

function StatPill({ icon, value, label, highlight = false, delay = 0 }: {
  icon: React.ReactNode | string
  value: string | number
  label: string
  highlight?: boolean
  delay?: number
}) {
  return (
    <div
      className="flex items-center gap-1 px-2.5 py-1 rounded-full tv-count-in"
      style={{
        animationDelay: `${delay}ms`,
        background: highlight ? 'rgba(0,201,212,0.15)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${highlight ? 'rgba(0,201,212,0.3)' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      <span className="text-xs leading-none">{icon}</span>
      <span className={`font-display font-bold text-xs ${highlight ? 'text-cyan-brand' : 'text-white/70'}`}>
        {value}
      </span>
      <span className="text-white/30 text-[10px]">{label}</span>
    </div>
  )
}

/* ── Main component ────────────────────────────── */
export default function LiveCheckIns() {
  const [entries, setEntries]   = useState<Entry[]>([])
  const [loading, setLoading]   = useState(true)
  const enterTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  function addEntry(e: Entry, isFresh: boolean) {
    const entry = { ...e, fresh: isFresh, entering: isFresh }
    setEntries(prev => {
      const without = prev.filter(x => x.id !== entry.id)
      return [entry, ...without].slice(0, 4)
    })

    if (isFresh) {
      // Remove "entering" class after animation completes
      const t1 = setTimeout(() => {
        setEntries(prev => prev.map(x => x.id === entry.id ? { ...x, entering: false } : x))
      }, 700)
      // Fade "fresh" glow after 8s
      const t2 = setTimeout(() => {
        setEntries(prev => prev.map(x => x.id === entry.id ? { ...x, fresh: false } : x))
      }, 8000)
      enterTimers.current.set(entry.id, t1)
      enterTimers.current.set(entry.id + '_fresh', t2)
    }
  }

  useEffect(() => {
    async function loadRecent() {
      const { data } = await supabase
        .from('attendance')
        .select('id, member_id, checked_in_at')
        .order('checked_in_at', { ascending: false })
        .limit(4)

      if (data) {
        const entries = await Promise.all(
          data.map(r => fetchEntry(r.member_id, r.id, r.checked_in_at))
        )
        entries.filter(Boolean).forEach(e => e && addEntry(e, false))
      }
      setLoading(false)
    }
    loadRecent()

    const channel = supabase
      .channel('tv-live-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, async (payload) => {
        const e = await fetchEntry(payload.new.member_id, payload.new.id, payload.new.checked_in_at)
        if (e) addEntry(e, true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      enterTimers.current.forEach(t => clearTimeout(t))
    }
  }, [])

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="relative w-2.5 h-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-brand" />
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cyan-brand" style={{ animation: 'livePing 2s ease-out infinite' }} />
        </div>
        <p className="font-display font-semibold text-white/50 text-xs uppercase tracking-widest">
          Recent check-ins
        </p>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0,1,2].map(i => (
            <div key={i} className="h-24 rounded-2xl tv-shimmer" style={{ opacity: 0.4, animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <IdleState />
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map((e, i) => (
            <CheckInCard key={e.id} entry={e} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
