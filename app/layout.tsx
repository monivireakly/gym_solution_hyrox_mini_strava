import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Q4 Gym',
  description: 'Q4 Gym — Hyrox check-in system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">{children}</body>
    </html>
  )
}
