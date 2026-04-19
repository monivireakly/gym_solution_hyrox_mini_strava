import TVQRCode from '@/components/TVQRCode'
import LiveCheckIns from '@/components/LiveCheckIns'
import Link from 'next/link'

export default function TVDisplay() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #004D54 0%, #003038 60%, #001e24 100%)' }}
    >
      {/* Ambient rings */}
      {[700, 500, 320].map((s, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: s, height: s,
            border: `1px solid rgba(0,201,212,${0.04 + i * 0.03})`,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: '#006D77', opacity: 0.3 }} />
      <div className="absolute -bottom-64 -left-48 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: '#006D77', opacity: 0.15 }} />

      {/* Main layout: QR left, live feed right */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-16 px-12 w-full max-w-5xl">

        {/* Left: branding + QR */}
        <div className="flex flex-col items-center gap-8 text-center">
          <div>
            <div className="font-display font-black text-8xl tracking-[-0.04em] leading-none"
              style={{ color: '#00C9D4' }}>
              Q4
            </div>
            <div className="font-display font-semibold text-white/40 text-lg tracking-[0.55em] uppercase mt-1">
              GYM
            </div>
          </div>

          <TVQRCode />

          <div>
            <p className="font-display font-bold text-white/80 text-2xl">Scan to check in</p>
            <p className="text-white/30 text-base mt-1">Point your phone camera at the code</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px self-stretch"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }} />

        {/* Right: live feed */}
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <LiveCheckIns />
        </div>
      </div>

      <Link href="/admin"
        className="fixed bottom-5 right-5 text-white/10 text-xs hover:text-white/30 transition-colors">
        Admin
      </Link>
    </div>
  )
}
