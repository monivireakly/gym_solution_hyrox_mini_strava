import TVQRCode from '@/components/TVQRCode'
import Link from 'next/link'

export default function TVDisplay() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #004D54 0%, #003038 60%, #001e24 100%)' }}
    >
      {/* Ambient rings */}
      {[600, 440, 290].map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: s,
            height: s,
            border: `1px solid rgba(0,201,212,${0.05 + i * 0.04})`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Glow blobs */}
      <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: '#006D77', opacity: 0.35 }} />
      <div className="absolute -bottom-64 -left-48 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: '#006D77', opacity: 0.2 }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 text-center px-8">

        {/* Logo */}
        <div>
          <div className="font-display font-black text-8xl tracking-[-0.04em] leading-none"
            style={{ color: '#00C9D4' }}>
            Q4
          </div>
          <div className="font-display font-semibold text-white/50 text-lg tracking-[0.55em] uppercase mt-1">
            GYM
          </div>
        </div>

        {/* QR card */}
        <TVQRCode />

        {/* Instruction */}
        <div className="flex flex-col items-center gap-2">
          <p className="font-display font-semibold text-white/80 text-2xl">
            Scan to check in
          </p>
          <p className="text-white/35 text-base">
            Point your phone camera at the code above
          </p>
        </div>
      </div>

      {/* Corner admin link — invisible unless hovered */}
      <Link
        href="/admin"
        className="fixed bottom-5 right-5 text-white/10 text-xs hover:text-white/30 transition-colors"
      >
        Admin
      </Link>
    </div>
  )
}
