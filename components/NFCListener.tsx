'use client'

/**
 * NFCListener — captures input from a USB HID NFC reader.
 *
 * USB NFC readers emulate a keyboard: when a card is tapped they "type"
 * the card's UID characters very fast (< 30 ms apart) and finish with Enter.
 * This component captures that burst, ignores real keyboard typing (too slow),
 * then POSTs the UID to /api/checkin/nfc.
 *
 * How to write member_id to NFC cards:
 *   Use any NFC writing app (e.g. NFC Tools on iOS/Android) to write the
 *   member's UUID (found in Supabase → members table) as plain text on the card.
 */

import { useEffect, useRef, useState } from 'react'

type FlashState = {
  name: string
  emoji: string
  color: string
  alreadyIn: boolean
}

const CHAR_GAP_MS   = 80    // keystrokes faster than this are from the reader
const FLUSH_TIMEOUT = 300   // ms after last char before treating buffer as complete scan

export default function NFCListener() {
  const buffer      = useRef('')
  const lastKey     = useRef(0)
  const flushTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [flash, setFlash] = useState<FlashState | null>(null)
  const flashTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showFlash(state: FlashState) {
    setFlash(state)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 4000)
  }

  async function submitScan(raw: string) {
    const memberId = raw.trim()
    // UUIDs are 36 chars; bail on anything that's clearly not a UUID
    if (memberId.length < 32) return

    try {
      const res  = await fetch('/api/checkin/nfc', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ member_id: memberId }),
      })
      const data = await res.json()
      if (data.member) {
        showFlash({
          name:      data.member.name,
          emoji:     data.member.emoji,
          color:     data.member.color,
          alreadyIn: !!data.alreadyCheckedIn,
        })
      }
    } catch { /* network error — silently ignore, TV keeps running */ }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Never intercept when the user is typing in a real input
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const now = Date.now()

      if (e.key === 'Enter') {
        if (flushTimer.current) clearTimeout(flushTimer.current)
        const captured = buffer.current
        buffer.current = ''
        if (captured.length > 0) submitScan(captured)
        return
      }

      if (e.key.length !== 1) return  // ignore Shift, Ctrl, etc.

      const gap = now - lastKey.current
      lastKey.current = now

      // If the gap between keystrokes is too long this is probably a human
      // typing, not a reader burst — reset the buffer
      if (gap > CHAR_GAP_MS && buffer.current.length > 0) {
        buffer.current = ''
      }

      buffer.current += e.key

      // Auto-flush in case the reader doesn't send Enter
      if (flushTimer.current) clearTimeout(flushTimer.current)
      flushTimer.current = setTimeout(() => {
        const captured = buffer.current
        buffer.current = ''
        if (captured.length >= 32) submitScan(captured)
      }, FLUSH_TIMEOUT)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (flushTimer.current)  clearTimeout(flushTimer.current)
      if (flashTimer.current)  clearTimeout(flashTimer.current)
    }
  }, [])

  if (!flash) return null

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 tv-card-enter"
      style={{ whiteSpace: 'nowrap' }}
    >
      <div
        className="flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-2xl"
        style={{
          background:    flash.alreadyIn ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${flash.color}30, rgba(0,201,212,0.15))`,
          borderColor:   flash.alreadyIn ? 'rgba(255,255,255,0.12)' : 'rgba(0,201,212,0.5)',
          backdropFilter: 'blur(16px)',
          boxShadow:     flash.alreadyIn ? 'none' : `0 0 40px ${flash.color}40`,
        }}
      >
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: flash.color, boxShadow: `0 4px 16px ${flash.color}60` }}
        >
          {flash.emoji}
        </div>

        {/* Text */}
        <div>
          <p className="font-display font-black text-white text-lg leading-none">
            {flash.name}
          </p>
          <p
            className="text-sm mt-1 font-display font-semibold"
            style={{ color: flash.alreadyIn ? 'rgba(255,255,255,0.35)' : '#00C9D4' }}
          >
            {flash.alreadyIn ? 'Already checked in today' : 'Checked in ✓'}
          </p>
        </div>

        {/* Live badge (only on fresh check-in) */}
        {!flash.alreadyIn && (
          <div
            className="ml-2 text-[10px] font-display font-black px-2.5 py-1 rounded-full tracking-wider flex-shrink-0"
            style={{ background: 'rgba(0,201,212,0.2)', color: '#00C9D4', border: '1px solid rgba(0,201,212,0.4)' }}
          >
            LIVE
          </div>
        )}
      </div>
    </div>
  )
}
