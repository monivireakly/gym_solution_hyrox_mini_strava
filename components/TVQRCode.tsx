'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function TVQRCode() {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.origin + '/enter')
  }, [])

  if (!url) return (
    <div className="w-72 h-72 rounded-3xl bg-white/10 animate-pulse" />
  )

  return (
    <div className="relative">
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-3xl blur-xl opacity-40 pointer-events-none"
        style={{ background: '#00C9D4', margin: -8 }}
      />
      {/* Card */}
      <div
        className="relative rounded-3xl p-5 bg-white shadow-2xl"
        style={{ boxShadow: '0 0 0 1px rgba(0,201,212,0.2), 0 32px 64px rgba(0,0,0,0.5)' }}
      >
        <QRCodeSVG
          value={url}
          size={240}
          bgColor="#FFFFFF"
          fgColor="#006D77"
          level="M"
          marginSize={0}
        />
      </div>
    </div>
  )
}
