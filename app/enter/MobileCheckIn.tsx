'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/Avatar'

type Member = { id: string; name: string }

const NUMPAD = ['1','2','3','4','5','6','7','8','9','⌫','0','']

const keyBase: React.CSSProperties = {
  height: 80,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.13)',
  borderBottomColor: 'rgba(0,0,0,0.5)',
  background: 'linear-gradient(175deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
  boxShadow: '0 8px 0 rgba(0,0,0,0.5), 0 10px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
  color: '#ffffff',
  fontSize: 26,
  fontFamily: 'Syne, sans-serif',
  fontWeight: 700,
  cursor: 'pointer',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  transition: 'box-shadow 0.06s ease, transform 0.06s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const keyDel: React.CSSProperties = {
  ...keyBase,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderBottomColor: 'rgba(0,0,0,0.35)',
  boxShadow: '0 5px 0 rgba(0,0,0,0.4), 0 6px 14px rgba(0,0,0,0.2)',
  color: 'rgba(255,255,255,0.4)',
  fontSize: 22,
}

const keyPressed: React.CSSProperties = {
  transform: 'translateY(7px)',
  boxShadow: '0 1px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,0,0,0.1)',
}

const keyDelPressed: React.CSSProperties = {
  transform: 'translateY(4px)',
  boxShadow: '0 1px 0 rgba(0,0,0,0.3)',
}

export default function MobileCheckIn() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [matches, setMatches] = useState<Member[]>([])
  const [pressed, setPressed] = useState<string | null>(null)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pressKey = useCallback(async (key: string) => {
    if (loading) return

    if (key === '⌫') {
      setPin(p => p.slice(0, -1))
      setError('')
      return
    }

    if (pin.length >= 4) return

    const next = pin + key
    setPin(next)
    setError('')

    if (next.length === 4) {
      setLoading(true)
      try {
        const { data, error: err } = await supabase
          .from('members')
          .select('id, name')
          .eq('pin', next)

        if (err) throw err

        if (!data || data.length === 0) {
          setError('PIN not found. Try again.')
          setPin('')
        } else if (data.length === 1) {
          await checkIn(data[0])
          return
        } else {
          setMatches(data)
        }
      } catch {
        setError('Connection error. Try again.')
        setPin('')
      } finally {
        setLoading(false)
      }
    }
  }, [pin, loading])

  async function checkIn(member: Member) {
    await supabase.from('attendance').insert({ member_id: member.id })
    router.push(`/checkin/${member.id}`)
  }

  function handlePress(key: string) {
    setPressed(key)
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => setPressed(null), 130)
    pressKey(key)
  }

  /* Member picker (same PIN, multiple people) */
  if (matches.length > 0) {
    return (
      <div className="flex flex-col gap-3 animate-fade-in">
        <p className="text-white/50 text-sm text-center font-display tracking-widest uppercase mb-2">
          Who are you?
        </p>
        {matches.map(m => (
          <button
            key={m.id}
            onClick={() => { setLoading(true); checkIn(m) }}
            disabled={loading}
            className="flex items-center gap-4 w-full py-4 px-5 rounded-2xl text-white font-display font-semibold text-lg transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            <Avatar name={m.name} size="sm" />
            {m.name}
          </button>
        ))}
        <button
          onClick={() => { setPin(''); setMatches([]); setError('') }}
          className="text-white/30 text-sm hover:text-white/60 transition-colors text-center pt-2"
        >
          Try a different PIN
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full">

      {/* PIN dots + status — glass inset card */}
      <div
        className="w-full rounded-2xl px-8 py-6 flex flex-col items-center gap-5"
        style={{
          background: 'rgba(0,0,0,0.28)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex gap-6">
          {[0,1,2,3].map(i => {
            const filled = pin.length > i
            return (
              <div
                key={i}
                className="transition-all duration-150"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: `2px solid ${filled ? '#00C9D4' : 'rgba(255,255,255,0.18)'}`,
                  background: filled ? '#00C9D4' : 'transparent',
                  transform: filled ? 'scale(1.25)' : 'scale(1)',
                  boxShadow: filled ? '0 0 14px rgba(0,201,212,0.75)' : 'none',
                }}
              />
            )
          })}
        </div>

        <div style={{ height: 20, display: 'flex', alignItems: 'center' }}>
          {error ? (
            <p className="text-red-400 text-sm font-medium">{error}</p>
          ) : loading ? (
            <p className="text-sm animate-pulse" style={{ color: '#83E0E5' }}>Checking you in…</p>
          ) : (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {pin.length === 0 ? 'Enter your PIN' : '\u00a0'}
            </p>
          )}
        </div>
      </div>

      {/* Numpad */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          width: '100%',
        }}
      >
        {NUMPAD.map((key, idx) => {
          if (key === '') return <div key={idx} />
          const isDel = key === '⌫'
          const isPressed = pressed === key
          return (
            <button
              key={key}
              onPointerDown={() => handlePress(key)}
              disabled={loading}
              style={{
                ...(isDel ? keyDel : keyBase),
                ...(isPressed ? (isDel ? keyDelPressed : keyPressed) : {}),
                opacity: loading ? 0.3 : 1,
              }}
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
