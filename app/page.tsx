import LiveCheckIns from '@/components/LiveCheckIns'
import NFCListener from '@/components/NFCListener'
import Link from 'next/link'

export default function TVDisplay() {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #003038 0%, #001e24 60%, #000f12 100%)' }}
    >
      {/* ── Aurora background ── */}
      <div className="tv-blob-1" />
      <div className="tv-blob-2" />
      <div className="tv-blob-3" />
      <div className="tv-grid" />

      {/* ── NFC card reader — listens for USB HID keyboard bursts ── */}
      <NFCListener />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col min-h-screen px-10 py-8">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            {/* Logo */}
            <div className="flex flex-col leading-none">
              <span className="font-display font-black text-5xl tracking-[-0.04em]" style={{ color: '#00C9D4' }}>
                Q4
              </span>
              <span className="font-display text-white/35 text-xs tracking-[0.6em] uppercase mt-0.5 ml-0.5">
                GYM
              </span>
            </div>

            <div className="w-px h-10 ml-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

            <div>
              <p className="font-display font-semibold text-white/60 text-sm tracking-wide">
                Today&apos;s Check-Ins
              </p>
              <p className="text-white/25 text-xs mt-0.5">Live board — updates automatically</p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full"
            style={{ background: 'rgba(0,201,212,0.08)', border: '1px solid rgba(0,201,212,0.2)' }}>
            <div className="relative w-2 h-2">
              <div className="w-2 h-2 rounded-full bg-cyan-brand" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-brand" style={{ animation: 'livePing 2s ease-out infinite' }} />
            </div>
            <span className="font-display font-bold text-xs tracking-widest uppercase" style={{ color: '#00C9D4' }}>
              Live
            </span>
          </div>
        </header>

        {/* Feed — centred, max width so it reads well on a 4K TV */}
        <main className="flex-1 flex items-start justify-center">
          <div className="w-full max-w-5xl">
            <LiveCheckIns />
          </div>
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-between mt-6">
          <p className="text-white/10 text-xs font-display tracking-widest uppercase">
            Hyrox Performance Tracking
          </p>
          <Link href="/admin" className="text-white/10 text-xs hover:text-white/30 transition-colors">
            Admin
          </Link>
        </footer>
      </div>
    </div>
  )
}
