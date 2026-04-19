export function calcStreak(dates: Date[]): { streak: number; total: number } {
  if (!dates.length) return { streak: 0, total: 0 }
  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime())
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let cursor = new Date(today)

  for (const d of sorted) {
    const day = new Date(d)
    day.setHours(0, 0, 0, 0)
    const diff = Math.round((cursor.getTime() - day.getTime()) / 86400000)
    if (diff === 0) { streak++; cursor.setDate(cursor.getDate() - 1) }
    else if (diff === 1) { streak++; cursor.setDate(cursor.getDate() - 1) }
    else break
  }

  return { streak, total: dates.length }
}
