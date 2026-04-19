import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { calcStats } from '@/lib/stats'
import { isAtRisk } from '@/lib/atrisk'
import Avatar from '@/components/Avatar'
import StreakCalendar from '@/components/StreakCalendar'

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const { data: member } = await supabase
    .from('members')
    .select('id, name, created_at')
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
  const atRisk = isAtRisk(dates[0] ?? null)

  const memberSince = new Date(member.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const max = Math.max(...stats.monthlyData.map(d => d.count), 1)

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
        <Link href="/leaderboard"
          className="inline-flex items-center gap-1 text-muted text-sm hover:text-sea transition-colors mb-2">
          ← Leaderboard
        </Link>

        {/* Profile header */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-sea-light">
          <div className="flex items-center gap-5">
            <Avatar name={member.name} size="xl" />
            <div className="min-w-0">
              <h1 className="font-display font-black text-2xl text-app-text truncate">{member.name}</h1>
              <p className="text-muted text-sm">Member since {memberSince}</p>
              {atRisk && (
                <span className="inline-block mt-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-medium">
                  Haven&apos;t seen you lately 👋
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '🔥', value: stats.streak,   label: 'Streak'   },
            { icon: '💪', value: stats.total,    label: 'Sessions' },
            { icon: '⚡', value: `${stats.consistency}%`, label: 'Consistent' },
          ].map(({ icon, value, label }) => (
            <div key={label} className="bg-surface rounded-2xl p-4 text-center border border-sea-light shadow-sm">
              <div className="text-lg">{icon}</div>
              <div className="font-display font-black text-xl text-sea mt-0.5">{value}</div>
              <div className="text-xs text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Detailed stats */}
        <div className="bg-surface rounded-3xl p-5 border border-sea-light shadow-sm">
          <p className="font-display font-semibold text-xs text-muted uppercase tracking-wider mb-4">Performance</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: 'Longest streak',  value: `🔥 ${stats.longestStreak} days` },
              { label: 'Best week',       value: `${stats.bestWeek} sessions`      },
              { label: 'Avg / week',      value: `${stats.avgPerWeek}×`            },
              { label: 'This month',      value: `${stats.thisMonth} sessions`     },
              { label: 'Last month',      value: `${stats.lastMonth} sessions`     },
              { label: 'Total',           value: `${stats.total} sessions`         },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted">{label}</p>
                <p className="font-display font-bold text-base text-app-text mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Monthly bars */}
          {stats.monthlyData.length > 0 && (
            <div className="mt-5 pt-4 border-t border-sea-light">
              <p className="text-xs text-muted mb-3">Monthly sessions</p>
              <div className="flex items-end gap-1.5 h-20">
                {stats.monthlyData.map((d, i) => {
                  const isLast = i === stats.monthlyData.length - 1
                  return (
                    <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <p className="font-display font-bold text-xs" style={{ color: isLast ? '#006D77' : '#5A7F84' }}>
                        {d.count > 0 ? d.count : ''}
                      </p>
                      <div className="w-full rounded-t-lg"
                        style={{
                          height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 0)}%`,
                          background: isLast ? '#006D77' : '#E8F4F5',
                          minHeight: d.count > 0 ? 4 : 2,
                        }}
                      />
                      <p className="text-[9px] text-muted">{d.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-surface rounded-3xl p-5 border border-sea-light shadow-sm">
          <p className="font-display font-semibold text-xs text-muted uppercase tracking-wider mb-3">Achievements</p>
          <div className="flex flex-wrap gap-2">
            {stats.achievements.map(a => (
              <div key={a.id} title={a.description}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-semibold ${
                  a.unlocked ? 'bg-sea text-white' : 'bg-sea-light/40 text-muted/40'
                }`}
              >
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-surface rounded-3xl p-5 border border-sea-light shadow-sm">
          <p className="font-display font-semibold text-xs text-muted uppercase tracking-wider mb-3">365-day activity</p>
          <StreakCalendar dates={dateStrings} />
        </div>
      </div>
    </div>
  )
}
