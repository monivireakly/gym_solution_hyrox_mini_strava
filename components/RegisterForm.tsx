'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Avatar from './Avatar'

export default function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || pin.length !== 4) return

    setLoading(true)
    setError('')

    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('pin', pin)
      .limit(1)

    if (existing && existing.length > 0) {
      setError('That PIN is already taken. Choose a different one.')
      setLoading(false)
      return
    }

    const { data: member, error: err } = await supabase
      .from('members')
      .insert({ name: name.trim(), pin })
      .select('id')
      .single()

    if (err || !member) {
      setError('Registration failed. Please try again.')
      setLoading(false)
      return
    }

    await supabase.from('attendance').insert({ member_id: member.id })
    router.push(`/checkin/${member.id}`)
  }

  const isValid = name.trim().length >= 2 && pin.length === 4

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {/* Live avatar preview */}
      <div className={`flex justify-center transition-all duration-300 ${name.trim() ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        {name.trim() && <Avatar name={name} size="xl" />}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-app-text/80">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Alex Johnson"
          required
          autoComplete="name"
          className="w-full border-2 border-sea-light rounded-xl px-4 py-3 font-body text-app-text placeholder:text-muted/50 focus:outline-none focus:border-sea transition-colors bg-white"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-app-text/80">Last 4 digits of phone</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          required
          className="w-full border-2 border-sea-light rounded-xl px-4 py-3 font-display text-2xl tracking-[0.6em] text-app-text placeholder:text-muted/40 focus:outline-none focus:border-sea transition-colors bg-white"
        />
        <p className="text-xs text-muted">This is your PIN for future check-ins.</p>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !isValid}
        className="bg-sea text-white font-display font-bold py-4 rounded-2xl hover:bg-sea-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] text-lg mt-1"
      >
        {loading ? 'Creating account…' : 'Create account & check in →'}
      </button>
    </form>
  )
}
