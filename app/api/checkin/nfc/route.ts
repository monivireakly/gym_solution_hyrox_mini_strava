import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { avatarEmoji, avatarColor } from '@/lib/avatar'

export async function POST(req: Request) {
  let body: { member_id?: string }
  try { body = await req.json() } catch { body = {} }

  const memberId = body.member_id?.trim()
  if (!memberId) {
    return NextResponse.json({ error: 'member_id required' }, { status: 400 })
  }

  const db = createServerClient()

  const { data: member } = await db
    .from('members')
    .select('id, name')
    .eq('id', memberId)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Same-day dedup — one check-in per member per calendar day
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: existing } = await db
    .from('attendance')
    .select('id')
    .eq('member_id', memberId)
    .gte('checked_in_at', todayStart.toISOString())
    .maybeSingle()

  if (!existing) {
    const { error } = await db
      .from('attendance')
      .insert({ member_id: memberId, checked_in_at: new Date().toISOString() })

    if (error) {
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }
  }

  return NextResponse.json({
    success: true,
    alreadyCheckedIn: !!existing,
    member: {
      id: member.id,
      name: member.name,
      emoji: avatarEmoji(member.name),
      color: avatarColor(member.name),
    },
  })
}
