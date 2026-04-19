'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { avatarEmoji, avatarColor } from '@/lib/avatar'
import { calcStats } from '@/lib/stats'

const MAX_ENTRIES = 10
const FRESH_TTL   = 8_000   // ms a card glows cyan after check-in
const SECS_PER_CARD = 5     // marquee scroll speed

type Entry = {
  id: string
  memberId: string
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
}

/* ─── data helpers ──────────────────────────────── */

function getTodayStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function getWeekStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString()
}

async function fetchEntry(
  memberId: string,
  checkInId: string,
  checkedInAt: string,
): Promise<Entry | null> {
  const [{ data: member }, { data: history }, { data: weekData }] = await Promise.all([
    supabase.from('members').select('name').eq('id', memberId).single(),
    supabase.from('attendance').select('checked_in_at').eq('member_id', memberId)
      .order('checked_in_at', { ascending: false }).limit(365),
    supabase.from('attendance').select('id').eq('member_id', memberId)
      .gte('checked_in_at', getWeekStart()),
  ])
  if (!member) return null

  const dates = (history ?? []).map(a => new Date(a.checked_in_at))
  const stats = calcStats(dates)

  return {
    id: checkInId,
    memberId,
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
  }
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60)   return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

/* ─── Idle placeholder ──────────────────────────── */
function IdleState() {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <div className="flex gap-3">
        {['🦁','🐯','🦊','🐺','🦅'].map((e, i) => (
          <div key={e}
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              animation: `tvIdle 2.5s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}>
            {e}
          </div>
        ))}
      </div>
      <p className="text-white/20 text-sm font-display tracking-wide">
        Waiting for check-ins…
      </p>
    </div>
  )
}

/* ─── Loading skeleton ──────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {[0,1,2,3].map(i => (
        <div key={i} className="h-20 rounded-2xl tv-shimmer"
          style={{ opacity: 0.35, animationDelay: `${i * 0.25}s` }} />
      ))}
    </div>
  )
}

/* ─── Stat pill ─────────────────────────────────── */
function FireIcon() {
  return <span className="tv-fire-wiggle inline-block">🔥</span>
}

function StatPill({
  icon, value, label, highlight = false, delay = 0,
}: {
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
      }}>
      <span className="text-xs leading-none">{icon}</span>
      <span className={`font-display font-bold text-xs ${highlight ? 'text-cyan-brand' : 'text-white/70'}`}>
        {value}
      </span>
      <span className="text-white/30 text-[10px]">{label}</span>
    </div>
  )
}

/* ─── Single check-in card ──────────────────────── */
function CheckInCard({ entry }: { entry: Entry }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-700 flex-shrink-0 ${
        entry.fresh ? 'tv-border-glow' : ''
      }`}
      style={{
        background: entry.fresh
          ? `linear-gradient(135deg, ${entry.color}28 0%, rgba(0,201,212,0.12) 100%)`
          : 'rgba(255,255,255,0.04)',
        borderColor: entry.fresh ? 'rgba(0,201,212,0.35)' : 'rgba(255,255,255,0.07)',
      }}>

      {/* Shimmer on older cards */}
      {!entry.fresh && <div className="absolute inset-0 tv-shimmer pointer-events-none" />}

      {/* Glow blob behind avatar */}
      <div
        className="absolute left-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full blur-2xl tv-glow-pulse pointer-events-none"
        style={{ background: entry.color }}
      />

      <div className="relative flex items-center gap-4 px-5 py-3.5">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 tv-emoji-float"
          style={{
            background: entry.color,
            boxShadow: `0 4px 16px ${entry.color}55`,
          }}>
          {entry.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="font-display font-black text-white text-base leading-none truncate">
              {entry.name}
            </p>
            {entry.fresh && (
              <div className="relative flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-cyan-brand" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-brand"
                  style={{ animation: 'livePing 1.5s ease-out infinite' }} />
              </div>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <StatPill icon={<FireIcon />} value={entry.streak}       label="streak"    highlight={entry.streak >= 7} />
            <StatPill icon="💪"          value={entry.total}         label="sessions"  />
            <StatPill icon="📊"          value={`${entry.consistency}%`} label="rate" highlight={entry.consistency >= 80} />
            {entry.thisWeek > 0 && (
              <StatPill icon="📅" value={entry.thisWeek} label="this wk" />
            )}
            {entry.longestStreak > entry.streak && entry.longestStreak > 0 && (
              <StatPill icon="🏆" value={`${entry.longestStreak}d`} label="best" />
            )}
          </div>
        </div>

        {/* Time / live badge */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {entry.fresh ? (
            <span className="text-[10px] font-display font-black px-2.5 py-1 rounded-full tracking-wider"
              style={{ background: 'rgba(0,201,212,0.2)', color: '#00C9D4', border: '1px solid rgba(0,201,212,0.4)' }}>
              LIVE
            </span>
          ) : (
            <span className="text-white/25 text-xs">{timeAgo(entry.at)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Marquee wrapper ───────────────────────────── */
function TickerFeed({ entries }: { entries: Entry[] }) {
  // Double the list for seamless wrap
  const doubled = [...entries, ...entries]
  // 5s per card keeps it readable on a TV from across the room
  const duration = Math.max(entries.length * SECS_PER_CARD, 15)

  return (
    <div className="overflow-hidden flex-1" style={{ position: 'relative' }}>
      {/* Fade edges so cards bleed in/out smoothly */}
      <div className="absolute inset-x-0 top-0 h-8 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,15,18,0.9), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-8 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,15,18,0.9), transparent)' }} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: `marqueeDown ${duration}s linear infinite`,
          willChange: 'transform',
        }}>
        {doubled.map((e, i) => (
          <CheckInCard key={`${e.memberId}-${i}`} entry={e} />
        ))}
      </div>
    </div>
  )
}

/* ─── Main component ────────────────────────────── */
export default function LiveCheckIns() {
  const [entries, setEntries]   = useState<Entry[]>([])
  const [loading, setLoading]   = useState(true)
  const freshTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  function mergeEntry(newEntry: Entry, isFresh: boolean) {
    setEntries(prev => {
      // One row per member — keep the freshest check-in
      const without = prev.filter(x => x.memberId !== newEntry.memberId)
      return [{ ...newEntry, fresh: isFresh }, ...without].slice(0, MAX_ENTRIES)
    })

    if (isFresh) {
      const key = newEntry.memberId
      const prev = freshTimers.current.get(key)
      if (prev) clearTimeout(prev)
      const t = setTimeout(() => {
        setEntries(p => p.map(x => x.memberId === key ? { ...x, fresh: false } : x))
      }, FRESH_TTL)
      freshTimers.current.set(key, t)
    }
  }

  useEffect(() => {
    async function loadToday() {
      const { data } = await supabase
        .from('attendance')
        .select('id, member_id, checked_in_at')
        .gte('checked_in_at', getTodayStart())
        .order('checked_in_at', { ascending: false })

      if (data) {
        // Server-side dedup: only most recent check-in per member
        const seen = new Set<string>()
        const unique = data.filter(r => {
          if (seen.has(r.member_id)) return false
          seen.add(r.member_id)
          return true
        }).slice(0, MAX_ENTRIES)

        const resolved = await Promise.all(
          unique.map(r => fetchEntry(r.member_id, r.id, r.checked_in_at))
        )
        resolved.filter(Boolean).forEach(e => e && mergeEntry(e, false))
      }
      setLoading(false)
    }

    loadToday()

    const channel = supabase
      .channel('tv-ticker-v1')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance' },
        async (payload) => {
          const e = await fetchEntry(
            payload.new.member_id,
            payload.new.id,
            payload.new.checked_in_at,
          )
          if (e) mergeEntry(e, true)
        })
      .subscribe()

    // Reconnect when tab regains focus (TV may sleep)
    function onVisible() {
      if (document.visibilityState === 'visible') loadToday()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
      freshTimers.current.forEach(t => clearTimeout(t))
    }
  }, [])

  const showTicker = !loading && entries.length >= 2

  return (
    <div className="w-full flex flex-col gap-3" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Header row */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative w-2.5 h-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-brand" />
          <div className="absolute inset-0 rounded-full bg-cyan-brand"
            style={{ animation: 'livePing 2s ease-out infinite' }} />
        </div>
        <p className="font-display font-semibold text-white/50 text-xs uppercase tracking-widest">
          {loading
            ? 'Loading…'
            : entries.length === 0
              ? 'No check-ins yet today'
              : `${entries.length} member${entries.length !== 1 ? 's' : ''} today`}
        </p>
      </div>

      {/* Body */}
      {loading ? (
        <LoadingSkeleton />
      ) : entries.length === 0 ? (
        <IdleState />
      ) : showTicker ? (
        <TickerFeed entries={entries} />
      ) : (
        // Single card — no ticker needed
        <div className="flex flex-col gap-2.5">
          {entries.map(e => <CheckInCard key={e.memberId} entry={e} />)}
        </div>
      )}
    </div>
  )
}
