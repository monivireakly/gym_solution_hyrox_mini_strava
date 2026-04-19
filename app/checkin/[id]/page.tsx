import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcStreak } from '@/lib/streak'
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
  const { streak, total } = calcStreak(dates)
  const dateStrings = (attendance ?? []).map(a => a.checked_in_at)

  // Weekly rank
  const weekStart = getWeekStart()
  const { data: weekData } = await supabase
    .from('attendance')
    .select('member_id')
    .gte('checked_in_at', weekStart.toISOString())

  const weekCounts: Record<string, number> = {}
  for (const row of weekData ?? []) {
    weekCounts[row.member_id] = (weekCounts[row.member_id] ?? 0) + 1
  }
  const myCount = weekCounts[params.id] ?? 0
  const rank = Object.values(weekCounts).filter(c => c > myCount).length + 1

  return (
    <div className="min-h-screen bg-sea-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-sea opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-sea opacity-30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="bg-surface rounded-3xl p-8 shadow-2xl">
          {/* Avatar + Welcome */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="relative">
              <Avatar name={member.name} size="xl" />
              {streak > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-display font-bold shadow-md">
                  🔥
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-muted text-sm font-medium">Welcome back</p>
              <h1 className="font-display font-bold text-3xl text-app-text">{member.name}</h1>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard
              value={`🔥 ${streak}`}
              label={streak === 1 ? 'day streak' : 'day streak'}
              highlight={streak >= 7}
            />
            <StatCard
              value={String(total)}
              label={total === 1 ? 'session' : 'sessions'}
            />
            <StatCard
              value={`#${rank}`}
              label="this week"
              highlight={rank <= 3}
            />
          </div>

          {/* Streak heatmap */}
          <div className="mb-8">
            <p className="text-xs font-display font-semibold text-muted uppercase tracking-wider mb-3">
              365-day activity
            </p>
            <StreakCalendar dates={dateStrings} />
          </div>

          {/* Countdown */}
          <CountdownRedirect seconds={8} redirectTo="/" />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  value,
  label,
  highlight = false,
}: {
  value: string
  label: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-4 text-center ${
        highlight ? 'bg-sea text-white' : 'bg-sea-light'
      }`}
    >
      <div className={`font-display font-bold text-xl ${highlight ? 'text-white' : 'text-sea'}`}>
        {value}
      </div>
      <div className={`text-xs mt-0.5 ${highlight ? 'text-white/70' : 'text-muted'}`}>{label}</div>
    </div>
  )
}
