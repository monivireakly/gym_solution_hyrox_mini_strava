'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: password }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Incorrect password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sea-dark flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="bg-surface rounded-3xl p-8 shadow-2xl">
          <div className="mb-8">
            <div className="font-display font-black text-4xl text-sea tracking-tight">Q4 GYM</div>
            <h1 className="font-display font-bold text-2xl text-app-text mt-1">Admin Access</h1>
            <p className="text-muted text-sm mt-1">Enter your admin password to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoFocus
              className="w-full border-2 border-sea-light rounded-xl px-4 py-3 font-body text-app-text placeholder:text-muted/40 focus:outline-none focus:border-sea transition-colors bg-white"
            />

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="bg-sea text-white font-display font-bold py-4 rounded-2xl hover:bg-sea-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? 'Checking…' : 'Enter Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
