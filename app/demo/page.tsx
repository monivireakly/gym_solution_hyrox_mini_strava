'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

const MOCK = { name: 'Alex Johnson', emoji: '🦁', color: '#006D77', streak: 14, total: 52, rank: 2 }

type Phase = 'tv' | 'scanning' | 'entering' | 'loading' | 'confirmed'

const PHASE_TV_WAIT      = 3000
const SCAN_TRANSITION    = 1200
const PIN_DIGIT_INTERVAL = 450
const LOADING_WAIT       = 1000
const CONFIRMED_SECS     = 6

/* ── TV screen (left panel) ─────────────────────── */
function TVScreen({ scanning }: { scanning: boolean }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #004D54 0%, #002830 100%)' }}
    >
      {[260, 190, 130].map((s, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: s, height: s, border: `1px solid rgba(0,201,212,${0.06 + i*0.04})`,
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      ))}
      <div className="relative z-10 flex flex-col items-center gap-5 text-center px-4">
        <div>
          <div className="font-display font-black text-5xl tracking-tight leading-none" style={{ color: '#00C9D4' }}>Q4</div>
          <div className="font-display text-white/40 text-xs tracking-[0.5em] uppercase mt-0.5">GYM</div>
        </div>
        {/* QR */}
        <div className="relative">
          <div className={`absolute inset-0 rounded-2xl blur-lg transition-opacity duration-700 ${scanning ? 'opacity-80' : 'opacity-30'}`}
            style={{ background: '#00C9D4', margin: -6 }} />
          <div className="relative bg-white rounded-2xl p-3 shadow-xl">
            <QRCodeSVG value="https://q4gym.app/enter" size={110} bgColor="#fff" fgColor="#006D77" level="M" marginSize={0} />
          </div>
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl"
              style={{ background: 'rgba(0,201,212,0.15)', backdropFilter: 'blur(2px)' }}>
              <div className="text-white/90 text-xs font-display font-bold tracking-wide">Scanning…</div>
            </div>
          )}
        </div>
        <div>
          <p className="font-display font-semibold text-white/70 text-base">Scan to check in</p>
          <p className="text-white/30 text-xs mt-0.5">Point your camera at the code</p>
        </div>
      </div>
    </div>
  )
}

/* ── Phone frame helper ─────────────────────────── */
function PhoneFrame({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  return (
    <div className="flex flex-col items-center transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}>
      {/* Phone body */}
      <div className="relative rounded-[32px] p-2"
        style={{
          background: 'linear-gradient(145deg, #1c1c1e, #0e0e10)',
          boxShadow: '0 0 0 1px #333, 0 32px 64px rgba(0,0,0,0.9), -4px 0 20px rgba(0,0,0,0.4)',
          width: 200,
        }}
      >
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-4 rounded-full z-20"
          style={{ background: '#0e0e10' }} />
        {/* Screen */}
        <div className="overflow-hidden rounded-[24px]"
          style={{ height: 400, background: '#000' }}>
          {children}
        </div>
        {/* Home bar */}
        <div className="w-16 h-1 rounded-full mx-auto mt-2" style={{ background: 'rgba(255,255,255,0.2)' }} />
      </div>
    </div>
  )
}

/* ── Phone: PIN entry screen ────────────────────── */
function PhonePinScreen({ pinCount, loading }: { pinCount: number; loading: boolean }) {
  const KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','']
  return (
    <div className="w-full h-full flex flex-col pt-10 pb-4 px-4"
      style={{ background: 'linear-gradient(160deg, #004D54 0%, #002830 100%)' }}
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="font-display font-black text-2xl" style={{ color: '#00C9D4' }}>Q4</div>
        <h2 className="font-display font-black text-xl text-white mt-2">Check in</h2>
        <p className="text-white/35 text-xs mt-1">Enter your 4-digit PIN</p>
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-4 mb-3">
        {[0,1,2,3].map(i => {
          const filled = pinCount > i
          return (
            <div key={i} className="rounded-full transition-all duration-150"
              style={{
                width: 12, height: 12,
                border: `2px solid ${filled ? '#00C9D4' : 'rgba(255,255,255,0.18)'}`,
                background: filled ? '#00C9D4' : 'transparent',
                transform: filled ? 'scale(1.2)' : 'scale(1)',
                boxShadow: filled ? '0 0 10px rgba(0,201,212,0.8)' : 'none',
              }} />
          )
        })}
      </div>
      {/* Status */}
      <div className="h-4 flex justify-center items-center mb-4">
        {loading
          ? <p className="text-xs animate-pulse" style={{ color: '#83E0E5' }}>Checking you in…</p>
          : <p className="text-xs text-white/20">{pinCount === 0 ? 'Enter your PIN' : '\u00a0'}</p>}
      </div>
      {/* Numpad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, flex: 1 }}>
        {KEYS.map((key, idx) => {
          if (key === '') return <div key={idx} />
          const isDel = key === '⌫'
          return (
            <div key={key}
              className="flex items-center justify-center rounded-2xl font-display font-bold select-none"
              style={{
                fontSize: isDel ? 16 : 20,
                color: isDel ? 'rgba(255,255,255,0.35)' : '#fff',
                background: isDel
                  ? 'rgba(255,255,255,0.04)'
                  : 'linear-gradient(175deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: isDel ? '0 4px 0 rgba(0,0,0,0.35)' : '0 6px 0 rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              {key}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Phone: Confirmed screen ────────────────────── */
function PhoneConfirmedScreen({ countdown }: { countdown: number }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4"
      style={{ background: 'linear-gradient(160deg, #004D54 0%, #002830 100%)' }}
    >
      <div className="bg-white rounded-3xl p-5 w-full shadow-2xl">
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg"
            style={{ background: MOCK.color, boxShadow: `0 4px 20px ${MOCK.color}66` }}>
            {MOCK.emoji}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] shadow">🔥</div>
          </div>
          <div className="text-center">
            <p className="text-muted text-xs">Welcome back</p>
            <p className="font-display font-bold text-app-text text-lg">{MOCK.name}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {[{v:`🔥${MOCK.streak}`,l:'streak'},{v:MOCK.total,l:'sessions'},{v:`#${MOCK.rank}`,l:'this week'}].map(({v,l}) => (
            <div key={l} className="rounded-xl p-2 text-center" style={{ background: '#E8F4F5' }}>
              <div className="font-display font-bold text-sm" style={{ color: '#006D77' }}>{v}</div>
              <div className="text-muted text-[9px] mt-0.5">{l}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5 text-muted text-xs">
          <div className="w-3 h-3 border border-sea border-t-transparent rounded-full animate-spin" />
          Closing in {countdown}s
        </div>
      </div>
    </div>
  )
}

/* ── Main demo ──────────────────────────────────── */
export default function DemoPage() {
  const [phase, setPhase]       = useState<Phase>('tv')
  const [pinCount, setPinCount] = useState(0)
  const [countdown, setCountdown] = useState(CONFIRMED_SECS)

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    if (phase === 'tv')        t = setTimeout(() => setPhase('scanning'), PHASE_TV_WAIT)
    else if (phase === 'scanning') t = setTimeout(() => { setPhase('entering'); setPinCount(0) }, SCAN_TRANSITION)
    else if (phase === 'entering') {
      if (pinCount < 4) t = setTimeout(() => setPinCount(c => c + 1), PIN_DIGIT_INTERVAL)
      else              t = setTimeout(() => setPhase('loading'), PIN_DIGIT_INTERVAL)
    }
    else if (phase === 'loading')    t = setTimeout(() => { setPhase('confirmed'); setCountdown(CONFIRMED_SECS) }, LOADING_WAIT)
    else if (phase === 'confirmed') {
      if (countdown > 0) t = setTimeout(() => setCountdown(c => c - 1), 1000)
      else               t = setTimeout(() => { setPhase('tv'); setPinCount(0) }, 500)
    }
    return () => clearTimeout(t)
  }, [phase, pinCount, countdown])

  const phases: { key: Phase; label: string }[] = [
    { key: 'tv',        label: 'TV display'  },
    { key: 'scanning',  label: 'Scanning'    },
    { key: 'entering',  label: 'PIN entry'   },
    { key: 'loading',   label: 'Verifying'   },
    { key: 'confirmed', label: 'Checked in!' },
  ]

  const showPhone = phase !== 'tv'
  const phonePhase = phase === 'confirmed' ? 'confirmed' : 'pin'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0e2428 0%, #050c0d 100%)' }}
    >
      <div className="text-center">
        <h1 className="font-display font-black text-3xl text-white/70 tracking-tight">Journey Preview</h1>
        <p className="text-white/25 text-sm mt-1">See the full check-in experience</p>
      </div>

      {/* TV + Phone side by side */}
      <div className="flex items-center gap-8 flex-wrap justify-center">

        {/* ── TV monitor ── */}
        <div className="flex flex-col items-center">
          <p className="text-white/30 text-xs font-display uppercase tracking-widest mb-3">TV Display</p>
          <div className="relative rounded-[14px] p-2.5"
            style={{
              background: 'linear-gradient(145deg, #1c1c1c 0%, #0d0d0d 100%)',
              boxShadow: '0 0 0 1px #2a2a2a, 0 32px 64px rgba(0,0,0,0.9)',
              width: 320,
            }}
          >
            <div className="absolute top-[9px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="overflow-hidden rounded-[8px]" style={{ height: 220 }}>
              <TVScreen scanning={phase === 'scanning'} />
            </div>
            <p className="text-white/10 text-[9px] text-center font-display tracking-widest uppercase mt-2">Q4 Gym Kiosk</p>
          </div>
          {/* Stand */}
          <div className="w-6 h-4" style={{ background: 'linear-gradient(to bottom, #1c1c1c, #111)' }} />
          <div className="h-2.5 rounded-b-lg" style={{ width: 100, background: 'linear-gradient(to bottom, #1c1c1c, #111)', boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }} />
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-2 text-white/20">
          <div className="text-2xl">{phase === 'tv' ? '⟶' : '📱'}</div>
          <p className="text-xs font-display tracking-wide">
            {phase === 'tv' ? 'waiting…' : phase === 'scanning' ? 'scanning…' : 'on phone'}
          </p>
        </div>

        {/* ── Phone ── */}
        <div className="flex flex-col items-center">
          <p className="text-white/30 text-xs font-display uppercase tracking-widest mb-3">Customer's Phone</p>
          <PhoneFrame visible={showPhone}>
            <div className="absolute inset-0 transition-opacity duration-500"
              style={{ opacity: phonePhase === 'pin' ? 1 : 0 }}>
              <PhonePinScreen pinCount={pinCount} loading={phase === 'loading'} />
            </div>
            <div className="absolute inset-0 transition-opacity duration-500"
              style={{ opacity: phonePhase === 'confirmed' ? 1 : 0 }}>
              <PhoneConfirmedScreen countdown={countdown} />
            </div>
          </PhoneFrame>
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center gap-5 flex-wrap justify-center">
        {phases.map(({ key, label }, i) => {
          const curr   = phases.findIndex(p => p.key === phase)
          const active = key === phase
          const done   = i < curr
          return (
            <div key={key} className="flex flex-col items-center gap-1.5">
              <div className="w-2 h-2 rounded-full transition-all duration-500"
                style={{
                  background: active ? '#00C9D4' : done ? '#006D77' : 'rgba(255,255,255,0.12)',
                  boxShadow: active ? '0 0 10px #00C9D4' : 'none',
                }} />
              <span className="text-[11px] font-display transition-colors duration-300"
                style={{ color: active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)' }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      <Link href="/" className="text-white/20 text-sm hover:text-white/45 transition-colors">
        ← TV display
      </Link>
    </div>
  )
}
