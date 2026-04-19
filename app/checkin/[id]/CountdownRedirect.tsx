'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CountdownRedirect({ seconds, redirectTo }: { seconds: number; redirectTo: string }) {
  const router = useRouter()
  const [count, setCount] = useState(seconds)

  useEffect(() => {
    if (count <= 0) {
      router.push(redirectTo)
      return
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, router, redirectTo])

  return (
    <div className="flex items-center justify-center gap-2 text-muted text-sm">
      <div
        className="w-4 h-4 rounded-full border-2 border-sea border-t-transparent animate-spin"
        style={{ animationDuration: '1s' }}
      />
      Returning to kiosk in {count}s
    </div>
  )
}
