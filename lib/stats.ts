export interface Achievement {
  id: string
  icon: string
  label: string
  description: string
  unlocked: boolean
}

export interface MonthData {
  label: string
  count: number
}

export interface MemberStats {
  streak: number
  longestStreak: number
  total: number
  thisMonth: number
  lastMonth: number
  bestWeek: number
  avgPerWeek: number
  consistency: number   // 0-100 %
  monthlyData: MonthData[]
  achievements: Achievement[]
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function calcStats(dates: Date[]): MemberStats {
  const total = dates.length
  const now = new Date()

  if (total === 0) return buildEmpty()

  // Unique calendar days
  const daySet = new Set(dates.map(d => toKey(d)))
  const uniqueDays = Array.from(daySet).sort()

  // Current streak (today or yesterday as anchor)
  const todayKey = toKey(now)
  const yestKey  = toKey(new Date(now.getTime() - 86_400_000))
  let streak = 0
  if (daySet.has(todayKey) || daySet.has(yestKey)) {
    const anchor = daySet.has(todayKey) ? new Date(todayKey) : new Date(yestKey)
    const cursor = new Date(anchor)
    while (daySet.has(toKey(cursor))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
  }

  // Longest streak ever
  let longestStreak = 1
  let run = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = Math.round(
      (new Date(uniqueDays[i]).getTime() - new Date(uniqueDays[i - 1]).getTime()) / 86_400_000
    )
    run = diff === 1 ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
  }
  longestStreak = Math.max(longestStreak, streak)

  // This / last month counts
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const thisMonth = dates.filter(d => d >= thisMonthStart).length
  const lastMonth = dates.filter(d => d >= lastMonthStart && d <= lastMonthEnd).length

  // Best week (Mon–Sun buckets)
  const weekBuckets: Record<string, number> = {}
  for (const d of dates) {
    const day = new Date(d)
    day.setHours(0, 0, 0, 0)
    const dow = day.getDay()
    const mon = new Date(day)
    mon.setDate(day.getDate() - (dow === 0 ? 6 : dow - 1))
    const key = toKey(mon)
    weekBuckets[key] = (weekBuckets[key] ?? 0) + 1
  }
  const bestWeek = Math.max(0, ...Object.values(weekBuckets))

  // Avg / week & consistency
  const first       = dates.reduce((a, b) => a < b ? a : b)
  const weeksSince  = Math.max(1, Math.ceil((Date.now() - first.getTime()) / (7 * 86_400_000)))
  const activeWeeks = Object.keys(weekBuckets).length
  const avgPerWeek  = Math.round((total / weeksSince) * 10) / 10
  const consistency = Math.round((activeWeeks / weeksSince) * 100)

  // Monthly data — last 6 months
  const monthlyData: MonthData[] = []
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    monthlyData.push({
      label: start.toLocaleString('en', { month: 'short' }),
      count: dates.filter(d => d >= start && d <= end).length,
    })
  }

  return {
    streak, longestStreak, total, thisMonth, lastMonth,
    bestWeek, avgPerWeek, consistency, monthlyData,
    achievements: buildAchievements({ total, longestStreak, bestWeek, consistency }),
  }
}

function buildEmpty(): MemberStats {
  return {
    streak: 0, longestStreak: 0, total: 0,
    thisMonth: 0, lastMonth: 0, bestWeek: 0,
    avgPerWeek: 0, consistency: 0, monthlyData: [],
    achievements: buildAchievements({ total: 0, longestStreak: 0, bestWeek: 0, consistency: 0 }),
  }
}

function buildAchievements(p: {
  total: number
  longestStreak: number
  bestWeek: number
  consistency: number
}): Achievement[] {
  return [
    { id: 'first',      icon: '🌱', label: 'First Rep',     description: 'First session logged',       unlocked: p.total >= 1   },
    { id: 'ten',        icon: '💪', label: 'In the Zone',   description: '10 sessions',                unlocked: p.total >= 10  },
    { id: 'thirty',     icon: '🏃', label: 'Committed',     description: '30 sessions',                unlocked: p.total >= 30  },
    { id: 'fifty',      icon: '🥊', label: 'Fighter',       description: '50 sessions',                unlocked: p.total >= 50  },
    { id: 'hundred',    icon: '🏆', label: 'Legend',        description: '100 sessions',               unlocked: p.total >= 100 },
    { id: 'streak7',    icon: '🔥', label: 'On Fire',       description: '7-day streak',               unlocked: p.longestStreak >= 7  },
    { id: 'streak14',   icon: '⚡', label: 'Unstoppable',   description: '14-day streak',              unlocked: p.longestStreak >= 14 },
    { id: 'streak30',   icon: '🌟', label: 'Elite',         description: '30-day streak',              unlocked: p.longestStreak >= 30 },
    { id: 'bestweek',   icon: '📅', label: 'Perfect Week',  description: '5+ sessions in one week',    unlocked: p.bestWeek >= 5       },
    { id: 'consistent', icon: '📊', label: 'Consistent',    description: '80%+ weekly consistency',    unlocked: p.consistency >= 80   },
  ]
}
