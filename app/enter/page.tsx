import Link from 'next/link'
import MobileCheckIn from './MobileCheckIn'

export default function EnterPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #004D54 0%, #002830 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-10 pb-6">
        <div>
          <div
            className="font-display font-black text-3xl tracking-[-0.03em] leading-none"
            style={{ color: '#00C9D4' }}
          >
            Q4
          </div>
          <div className="font-display text-white/40 text-xs tracking-[0.5em] uppercase mt-0.5">
            GYM
          </div>
        </div>
        <Link
          href="/leaderboard"
          className="text-white/30 text-sm hover:text-white/60 transition-colors font-display"
        >
          Leaderboard ↗
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="font-display font-black text-4xl text-white leading-tight">
              Check in
            </h1>
            <p className="text-white/40 text-sm mt-2">
              Enter your 4-digit PIN to log your session
            </p>
          </div>

          <MobileCheckIn />

          {/* Register link */}
          <div className="text-center mt-10">
            <p className="text-white/30 text-sm">New here?</p>
            <Link
              href="/register"
              className="font-display font-semibold text-cyan-dim hover:text-white transition-colors"
            >
              Create your account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
