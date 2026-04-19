import Link from 'next/link'
import RegisterForm from '@/components/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-sea-dark flex items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-sea opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-sea opacity-25 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="bg-surface rounded-3xl p-8 shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="mb-8">
            <div
              className="font-display font-black text-4xl tracking-[-0.04em] leading-none"
              style={{ color: '#006D77' }}
            >
              Q4 GYM
            </div>
            <h1 className="font-display font-bold text-2xl text-app-text mt-2">
              First time? Welcome.
            </h1>
            <p className="text-muted text-sm mt-1">
              Create your account to check in and track your progress.
            </p>
          </div>

          <RegisterForm />

          <Link
            href="/"
            className="block text-center text-muted/60 text-sm mt-6 hover:text-sea transition-colors"
          >
            ← Back to check in
          </Link>
        </div>
      </div>
    </div>
  )
}
