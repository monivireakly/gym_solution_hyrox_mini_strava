import { redirect, notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function CardCheckIn({ params }: { params: { id: string } }) {
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('id', params.id)
    .single()

  if (!member) notFound()

  // Deduplicate: only insert if not already checked in today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', params.id)
    .gte('checked_in_at', today.toISOString())

  if (!count || count === 0) {
    await supabase.from('attendance').insert({ member_id: params.id })
  }

  redirect(`/checkin/${params.id}`)
}
