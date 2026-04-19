'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import LeaderboardRow from '@/components/LeaderboardRow'

type LeaderEntry = { id: string; name: string; count: number }

function getWeekStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

export default function LeaderboardPage() {
  const [view, setView] = useState<'week' | 'alltime'>('week')
  const [entries, setEntries] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load(view)
  }, [view])

  async function load(v: 'week' | 'alltime') {
    setLoading(true)

    let query = supabase
      .from('attendance')
      .select('member_id, members!inner(id, name)')

    if (v === 'week') {
      query = query.gte('checked_in_at', getWeekStart().toISOString())
    }

    const { data } = await query

    if (!data) {
      setEntries([])
      setLoading(false)
      return
    }

    const counts: Record<string, LeaderEntry> = {}
    for (const row of data) {
      const m = row.members as unknown as { id: string; name: string }
      if (!counts[m.id]) counts[m.id] = { id: m.id, name: m.name, count: 0 }
      counts[m.id].count++
    }

    const sorted = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    setEntries(sorted)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-muted text-sm hover:text-sea transition-colors mb-5"
          >
            ← Kiosk
          </Link>
          <h1 className="font-display font-black text-5xl text-app-text tracking-tight">
            Leader
            <br />
            board
          </h1>
          <p className="text-muted text-sm mt-2">Who's putting in the work?</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-sea-light rounded-xl p-1 w-fit mb-8 gap-1">
          {(['week', 'alltime'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-5 py-2 rounded-lg font-display font-semibold text-sm transition-all ${
                view === v ? 'bg-sea text-white shadow-sm' : 'text-muted hover:text-sea'
              }`}
            >
              {v === 'week' ? 'This Week' : 'All Time'}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-sea border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-4xl mb-3">🏋️</p>
            <p className="text-muted">No check-ins yet {view === 'week' ? 'this week' : ''}.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, i) => (
              <LeaderboardRow key={entry.id} rank={i + 1} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
