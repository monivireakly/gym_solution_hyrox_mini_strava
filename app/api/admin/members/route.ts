import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import { calcStreak } from '@/lib/streak'

function checkAuth(): boolean {
  const cookieStore = cookies()
  const auth = cookieStore.get('admin_auth')
  return auth?.value === process.env.ADMIN_SECRET
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServerClient()

  const { data: members } = await db
    .from('members')
    .select('id, name, pin, created_at')
    .order('name')

  const { data: allAttendance } = await db
    .from('attendance')
    .select('member_id, checked_in_at')
    .order('checked_in_at', { ascending: false })

  const lastCheckinMap: Record<string, string> = {}
  const allDatesMap: Record<string, string[]> = {}

  for (const ci of allAttendance ?? []) {
    if (!lastCheckinMap[ci.member_id]) {
      lastCheckinMap[ci.member_id] = ci.checked_in_at
    }
    if (!allDatesMap[ci.member_id]) allDatesMap[ci.member_id] = []
    allDatesMap[ci.member_id].push(ci.checked_in_at)
  }

  const enriched = (members ?? []).map(m => {
    const dates = (allDatesMap[m.id] ?? []).map(d => new Date(d))
    const { streak, total } = calcStreak(dates)
    return {
      ...m,
      lastCheckin: lastCheckinMap[m.id] ?? null,
      streak,
      total,
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(request: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, pin } = await request.json()

  if (!name || typeof pin !== 'string' || pin.length !== 4) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const db = createServerClient()
  const { data, error } = await db
    .from('members')
    .insert({ name, pin })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
