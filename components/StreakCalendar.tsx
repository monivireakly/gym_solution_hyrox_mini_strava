'use client'

import { useMemo } from 'react'

interface StreakCalendarProps {
  dates: string[]
}

type Cell = { date: string; active: boolean; isToday: boolean } | null

export default function StreakCalendar({ dates }: StreakCalendarProps) {
  const { weeks } = useMemo(() => {
    const checkinSet = new Set(
      dates.map(d => {
        const dt = new Date(d)
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      })
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = new Date(today)
    start.setDate(start.getDate() - 364)
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay())

    const weeks: Cell[][] = []
    const cursor = new Date(start)

    while (cursor <= today) {
      const week: Cell[] = []
      for (let d = 0; d < 7; d++) {
        const day = new Date(cursor)
        day.setDate(day.getDate() + d)

        if (day > today) {
          week.push(null)
        } else {
          const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
          week.push({ date: key, active: checkinSet.has(key), isToday: day.getTime() === today.getTime() })
        }
      }
      weeks.push(week)
      cursor.setDate(cursor.getDate() + 7)
    }

    return { weeks }
  }, [dates])

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-[3px] min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                title={day?.date}
                className={`w-[10px] h-[10px] rounded-[2px] transition-transform hover:scale-150 ${
                  day === null
                    ? 'bg-transparent'
                    : day.active
                    ? 'bg-cyan-brand'
                    : day.isToday
                    ? 'bg-sea/30 ring-1 ring-sea'
                    : 'bg-sea-light'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
