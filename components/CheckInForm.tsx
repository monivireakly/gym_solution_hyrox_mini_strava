'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Avatar from './Avatar'

type Member = { id: string; name: string }

const NUMPAD = ['1','2','3','4','5','6','7','8','9','⌫','0','']

/* Pressed-state style helpers */
const keyBase: React.CSSProperties = {
  height: 76,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.14)',
  borderBottomColor: 'rgba(0,0,0,0.45)',
  background: 'linear-gradient(175deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)',
  boxShadow: '0 8px 0 rgba(0,0,0,0.45), 0 10px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
  color: '#ffffff',
  fontSize: 24,
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
  border: '1px solid rgba(255,255,255,0.08)',
  borderBottomColor: 'rgba(0,0,0,0.3)',
  boxShadow: '0 5px 0 rgba(0,0,0,0.35), 0 6px 14px rgba(0,0,0,0.25)',
  color: 'rgba(255,255,255,0.45)',
  fontSize: 20,
}

const keyPressed: React.CSSProperties = {
  transform: 'translateY(6px)',
  boxShadow: '0 2px 0 rgba(0,0,0,0.4), 0 3px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(0,0,0,0.15)',
}

const keyDelPressed: React.CSSProperties = {
  transform: 'translateY(4px)',
  boxShadow: '0 1px 0 rgba(0,0,0,0.35)',
}

export default function CheckInForm() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [matches, setMatches] = useState<Member[]>([])
  const [pressed, setPressed] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  async function selectMember(member: Member) {
    setLoading(true)
    await checkIn(member)
  }

  function cancelPicker() {
    setPin('')
    setError('')
    setMatches([])
  }

  function handlePress(key: string) {
    setPressed(key)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setPressed(null), 120)
    pressKey(key)
  }

  /* ── Member picker ──────────────────────────── */
  if (matches.length > 0) {
    return (
      <div className="flex flex-col gap-3 w-full max-w-xs animate-fade-in">
        <p className="text-white/50 text-sm text-center font-display tracking-widest uppercase">Who are you?</p>
        {matches.map(m => (
          <button
            key={m.id}
            onClick={() => selectMember(m)}
            disabled={loading}
            className="flex items-center gap-4 w-full py-4 px-5 rounded-2xl text-white font-display font-semibold text-lg transition-all active:scale-95 disabled:opacity-50"
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
          onClick={cancelPicker}
          className="text-white/30 text-sm hover:text-white/60 transition-colors pt-2"
        >
          Cancel
        </button>
      </div>
    )
  }

  /* ── Main keypad ────────────────────────────── */
  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-xs">

      {/* PIN display — glass card */}
      <div className="w-full rounded-2xl px-6 py-5 flex flex-col items-center gap-4"
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Dots row */}
        <div className="flex gap-5">
          {[0,1,2,3].map(i => {
            const filled = pin.length > i
            return (
              <div key={i}
                className="transition-all duration-200"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${filled ? '#00C9D4' : 'rgba(255,255,255,0.2)'}`,
                  background: filled ? '#00C9D4' : 'transparent',
                  transform: filled ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: filled ? '0 0 12px rgba(0,201,212,0.7)' : 'none',
                }}
              />
            )
          })}
        </div>

        {/* Status line */}
        <div style={{ height: 18, display: 'flex', alignItems: 'center' }}>
          {error ? (
            <p className="text-red-400 text-xs font-medium">{error}</p>
          ) : loading ? (
            <p className="text-xs animate-pulse" style={{ color: '#83E0E5' }}>Looking you up…</p>
          ) : (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {pin.length === 0 ? 'Enter your 4-digit PIN' : '\u00a0'}
            </p>
          )}
        </div>
      </div>

      {/* Numpad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' }}>
        {NUMPAD.map((key, idx) => {
          if (key === '') return <div key={idx} />

          const isDel = key === '⌫'
          const isPressed = pressed === key
          const base = isDel ? keyDel : keyBase
          const pressedStyle = isDel ? keyDelPressed : keyPressed

          return (
            <button
              key={key}
              onPointerDown={() => handlePress(key)}
              disabled={loading}
              style={{
                ...base,
                ...(isPressed ? pressedStyle : {}),
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
