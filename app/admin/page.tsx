import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { isAtRisk } from '@/lib/atrisk'

function getWeekStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

function getTodayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function AdminDashboard() {
  const db = createServerClient()
  const today = getTodayStart()
  const weekStart = getWeekStart()

  const [
    { count: memberCount },
    { count: todayCount },
    { count: weekCount },
    { data: allMembers },
    { data: allAttendance },
  ] = await Promise.all([
    db.from('members').select('*', { count: 'exact', head: true }),
    db.from('attendance').select('*', { count: 'exact', head: true }).gte('checked_in_at', today.toISOString()),
    db.from('attendance').select('*', { count: 'exact', head: true }).gte('checked_in_at', weekStart.toISOString()),
    db.from('members').select('id'),
    db.from('attendance').select('member_id, checked_in_at').order('checked_in_at', { ascending: false }),
  ])

  const lastCheckinMap: Record<string, Date> = {}
  for (const ci of allAttendance ?? []) {
    if (!lastCheckinMap[ci.member_id]) {
      lastCheckinMap[ci.member_id] = new Date(ci.checked_in_at)
    }
  }

  const atRiskCount = (allMembers ?? []).filter(m => isAtRisk(lastCheckinMap[m.id] ?? null)).length

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display font-black text-4xl text-app-text mb-2">Dashboard</h1>
      <p className="text-muted mb-10">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Members" value={memberCount ?? 0} />
        <StatCard label="Check-ins Today" value={todayCount ?? 0} accent />
        <StatCard label="This Week" value={weekCount ?? 0} />
        <StatCard label="At Risk" value={atRiskCount} warning={atRiskCount > 0} />
      </div>

      {/* Quick links */}
      <div className="flex gap-4 flex-wrap">
        <Link
          href="/admin/members"
          className="bg-sea text-white font-display font-semibold px-6 py-3 rounded-xl hover:bg-sea-dark transition-colors"
        >
          Manage Members →
        </Link>
        <Link
          href="/admin/attendance"
          className="bg-sea-light text-sea font-display font-semibold px-6 py-3 rounded-xl hover:bg-sea hover:text-white transition-colors"
        >
          Attendance Log →
        </Link>
        <Link
          href="/leaderboard"
          className="bg-surface border border-sea-light text-app-text font-display font-semibold px-6 py-3 rounded-xl hover:border-sea transition-colors"
        >
          Leaderboard ↗
        </Link>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent = false,
  warning = false,
}: {
  label: string
  value: number
  accent?: boolean
  warning?: boolean
}) {
  const bg = warning && value > 0 ? 'bg-amber-50 border-amber-200' : accent ? 'bg-sea' : 'bg-surface border-sea-light'
  const numColor = warning && value > 0 ? 'text-amber-600' : accent ? 'text-white' : 'text-sea'
  const labelColor = warning && value > 0 ? 'text-amber-500' : accent ? 'text-white/70' : 'text-muted'

  return (
    <div className={`rounded-2xl p-5 border ${bg}`}>
      <div className={`font-display font-black text-4xl ${numColor}`}>{value}</div>
      <div className={`text-xs mt-1 font-medium ${labelColor}`}>{label}</div>
    </div>
  )
}
