import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'

function checkAuth(): boolean {
  const cookieStore = cookies()
  const auth = cookieStore.get('admin_auth')
  return auth?.value === process.env.ADMIN_SECRET
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed: Record<string, unknown> = {}
  if (body.name) allowed.name = body.name
  if (body.pin && String(body.pin).length === 4) allowed.pin = String(body.pin)

  const db = createServerClient()
  const { error } = await db.from('members').update(allowed).eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServerClient()
  const { error } = await db.from('members').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
