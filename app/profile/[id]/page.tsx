import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { calcStreak } from '@/lib/streak'
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
  const { streak, total } = calcStreak(dates)
  const lastCheckin = dates[0] ?? null
  const atRisk = isAtRisk(lastCheckin)
  const dateStrings = (attendance ?? []).map(a => a.checked_in_at)

  const daysSinceLastVisit = lastCheckin
    ? Math.floor((Date.now() - lastCheckin.getTime()) / 86400000)
    : null

  const memberSince = new Date(member.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1 text-muted text-sm hover:text-sea transition-colors mb-6"
        >
          ← Leaderboard
        </Link>

        <div className="bg-surface rounded-3xl p-8 shadow-sm border border-sea-light">
          {/* Profile header */}
          <div className="flex items-center gap-5 mb-8">
            <Avatar name={member.name} size="xl" />
            <div className="min-w-0">
              <h1 className="font-display font-bold text-2xl text-app-text truncate">{member.name}</h1>
              <p className="text-muted text-sm mt-0.5">Member since {memberSince}</p>
              {atRisk && (
                <span className="inline-block mt-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-medium">
                  Haven&apos;t seen you lately 👋
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-sea-light rounded-2xl p-4 text-center">
              <div className="font-display font-bold text-2xl text-sea">🔥 {streak}</div>
              <div className="text-xs text-muted mt-1">Day streak</div>
            </div>
            <div className="bg-sea-light rounded-2xl p-4 text-center">
              <div className="font-display font-bold text-2xl text-sea">{total}</div>
              <div className="text-xs text-muted mt-1">Total sessions</div>
            </div>
            <div className="bg-sea-light rounded-2xl p-4 text-center">
              <div className="font-display font-bold text-2xl text-sea">
                {daysSinceLastVisit !== null ? daysSinceLastVisit : '—'}
              </div>
              <div className="text-xs text-muted mt-1">Days since last</div>
            </div>
          </div>

          {/* Calendar */}
          <div>
            <p className="text-xs font-display font-semibold text-muted uppercase tracking-wider mb-3">
              365-day activity
            </p>
            <StreakCalendar dates={dateStrings} />
          </div>
        </div>
      </div>
    </div>
  )
}
