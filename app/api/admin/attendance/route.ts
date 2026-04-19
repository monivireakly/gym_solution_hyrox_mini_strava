import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'

function checkAuth(): boolean {
  const cookieStore = cookies()
  const auth = cookieStore.get('admin_auth')
  return auth?.value === process.env.ADMIN_SECRET
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServerClient()
  const { data, error } = await db
    .from('attendance')
    .select('id, member_id, checked_in_at, members!inner(name)')
    .order('checked_in_at', { ascending: false })
    .limit(1000)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map(r => ({
    id: r.id,
    member_id: r.member_id,
    member_name: (r.members as unknown as { name: string }).name,
    checked_in_at: r.checked_in_at,
  }))

  return NextResponse.json(rows)
}
