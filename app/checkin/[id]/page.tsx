import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcStats } from '@/lib/stats'
import Avatar from '@/components/Avatar'
import StreakCalendar from '@/components/StreakCalendar'
import CountdownRedirect from './CountdownRedirect'

function getWeekStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

export default async function CheckInPage({ params }: { params: { id: string } }) {
  const { data: member } = await supabase
    .from('members')
    .select('id, name')
    .eq('id', params.id)
    .single()

  if (!member) notFound()

  const { data: attendance } = await supabase
    .from('attendance')
    .select('checked_in_at')
    .eq('member_id', params.id)
    .order('checked_in_at', { ascending: false })

  const dates = (attendance ?? []).map(a => new Date(a.checked_in_at))
  const stats = calcStats(dates)
  const dateStrings = (attendance ?? []).map(a => a.checked_in_at)

  // Weekly rank
  const { data: weekData } = await supabase
    .from('attendance')
    .select('member_id')
    .gte('checked_in_at', getWeekStart().toISOString())

  const weekCounts: Record<string, number> = {}
  for (const row of weekData ?? []) {
    weekCounts[row.member_id] = (weekCounts[row.member_id] ?? 0) + 1
  }
  const myCount = weekCounts[params.id] ?? 0
  const rank = Object.values(weekCounts).filter(c => c > myCount).length + 1

  const newAchievement = stats.achievements.find(a =>
    a.unlocked && (
      (a.id === 'first'    && stats.total === 1)   ||
      (a.id === 'ten'      && stats.total === 10)  ||
      (a.id === 'thirty'   && stats.total === 30)  ||
      (a.id === 'fifty'    && stats.total === 50)  ||
      (a.id === 'hundred'  && stats.total === 100) ||
      (a.id === 'streak7'  && stats.streak === 7)  ||
      (a.id === 'streak14' && stats.streak === 14) ||
      (a.id === 'streak30' && stats.streak === 30)
    )
  )

  const monthTrend = stats.lastMonth > 0
    ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
    : null

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-6"
      style={{ background: 'linear-gradient(160deg, #004D54 0%, #002830 100%)' }}
    >
      <div className="w-full max-w-md space-y-3 animate-fade-in">

        {/* Header card */}
        <div className="bg-surface rounded-3xl p-6 shadow-2xl text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar name={member.name} size="xl" />
              {stats.streak >= 7 && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-sm shadow-md">🔥</div>
              )}
            </div>
            <div>
              <p className="text-sea text-sm font-display font-semibold tracking-wide">✓ Checked in</p>
              <h1 className="font-display font-black text-2xl text-app-text mt-0.5">{member.name}</h1>
            </div>
          </div>

          {/* New achievement banner */}
          {newAchievement && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl animate-scale-in"
              style={{ background: 'linear-gradient(135deg, #006D77, #00C9D4)', color: 'white' }}>
              <span className="text-2xl">{newAchievement.icon}</span>
              <div className="text-left">
                <p className="font-display font-bold text-sm">Achievement unlocked!</p>
                <p className="text-white/80 text-xs">{newAchievement.label} — {newAchievement.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Primary stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon="🔥" value={stats.streak} label="Day streak" highlight={stats.streak >= 7} />
          <StatCard icon="💪" value={stats.total} label="Sessions" />
          <StatCard icon="🏅" value={`#${rank}`} label="This week" highlight={rank <= 3} />
        </div>

        {/* Secondary stats — Strava style */}
        <div className="bg-surface rounded-3xl p-5 shadow-sm">
          <p className="font-display font-semibold text-xs text-muted uppercase tracking-wider mb-4">Your stats</p>
          <div className="grid grid-cols-2 gap-4">
            <SecondaryStatRow label="Longest streak" value={`🔥 ${stats.longestStreak} days`} />
            <SecondaryStatRow label="Best week"      value={`${stats.bestWeek} sessions`} />
            <SecondaryStatRow label="Avg / week"     value={`${stats.avgPerWeek}×`} />
            <SecondaryStatRow label="Consistency"    value={`${stats.consistency}%`}
              highlight={stats.consistency >= 80} />
          </div>

          {/* This month vs last */}
          <div className="mt-4 pt-4 border-t border-sea-light flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">This month</p>
              <p className="font-display font-bold text-xl text-app-text">{stats.thisMonth} sessions</p>
            </div>
            {monthTrend !== null && (
              <div className={`text-sm font-display font-semibold px-3 py-1 rounded-full ${
                monthTrend >= 0 ? 'bg-sea-light text-sea' : 'bg-red-50 text-red-500'
              }`}>
                {monthTrend >= 0 ? '↑' : '↓'} {Math.abs(monthTrend)}% vs last month
              </div>
            )}
          </div>

          {/* Monthly bar chart */}
          {stats.monthlyData.length > 0 && (
            <div className="mt-4">
              <MonthlyBars data={stats.monthlyData} />
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-surface rounded-3xl p-5 shadow-sm">
          <p className="font-display font-semibold text-xs text-muted uppercase tracking-wider mb-3">Achievements</p>
          <div className="flex flex-wrap gap-2">
            {stats.achievements.map(a => (
              <div key={a.id} title={a.description}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-semibold transition-all ${
                  a.unlocked
                    ? 'bg-sea text-white shadow-sm'
                    : 'bg-sea-light/50 text-muted/40'
                }`}
              >
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-surface rounded-3xl p-5 shadow-sm">
          <p className="font-display font-semibold text-xs text-muted uppercase tracking-wider mb-3">365-day activity</p>
          <StreakCalendar dates={dateStrings} />
        </div>

        {/* Countdown */}
        <div className="pb-6">
          <CountdownRedirect seconds={12} redirectTo="/enter" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, highlight = false }: {
  icon: string; value: string | number; label: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-2xl p-4 text-center ${highlight ? 'bg-sea' : 'bg-surface'} shadow-sm`}>
      <div className="text-lg mb-0.5">{icon}</div>
      <div className={`font-display font-black text-xl ${highlight ? 'text-white' : 'text-sea'}`}>{value}</div>
      <div className={`text-xs mt-0.5 ${highlight ? 'text-white/70' : 'text-muted'}`}>{label}</div>
    </div>
  )
}

function SecondaryStatRow({ label, value, highlight = false }: {
  label: string; value: string; highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-display font-bold text-base mt-0.5 ${highlight ? 'text-sea' : 'text-app-text'}`}>{value}</p>
    </div>
  )
}

function MonthlyBars({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => {
        const isLast = i === data.length - 1
        const pct = (d.count / max) * 100
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="w-full rounded-t-lg transition-all duration-500"
              style={{
                height: `${Math.max(pct, 4)}%`,
                background: isLast ? '#006D77' : '#E8F4F5',
                minHeight: d.count > 0 ? 4 : 2,
              }}
            />
            <p className="text-[9px] text-muted">{d.label}</p>
          </div>
        )
      })}
    </div>
  )
}
