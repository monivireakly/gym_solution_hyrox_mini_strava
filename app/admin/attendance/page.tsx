'use client'

import { useState, useEffect } from 'react'
import Avatar from '@/components/Avatar'

type Row = {
  id: string
  member_id: string
  member_name: string
  checked_in_at: string
}

export default function AttendancePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetch('/api/admin/attendance')
      .then(r => r.json())
      .then(data => { setRows(data ?? []); setLoading(false) })
  }, [])

  const filtered = rows.filter(r => {
    const matchName = !search || r.member_name.toLowerCase().includes(search.toLowerCase())
    const ts = new Date(r.checked_in_at)
    const matchFrom = !dateFrom || ts >= new Date(dateFrom)
    const matchTo = !dateTo || ts <= new Date(dateTo + 'T23:59:59')
    return matchName && matchFrom && matchTo
  })

  function exportCsv() {
    const header = 'Member,Date,Time\n'
    const body = filtered
      .map(r => {
        const d = new Date(r.checked_in_at)
        return `"${r.member_name}",${d.toLocaleDateString()},${d.toLocaleTimeString()}`
      })
      .join('\n')
    const blob = new Blob([header + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `q4-attendance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-4xl text-app-text">Attendance</h1>
          <p className="text-muted text-sm mt-1">{filtered.length} records</p>
        </div>
        <button
          onClick={exportCsv}
          className="bg-sea-light text-sea font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-sea hover:text-white transition-all"
        >
          Export CSV ↓
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border-2 border-sea-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sea transition-colors w-52"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="border-2 border-sea-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sea transition-colors"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="border-2 border-sea-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sea transition-colors"
        />
        {(search || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
            className="text-muted text-sm hover:text-sea transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-sea border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-sea-light overflow-hidden shadow-sm">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>Member</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-12">No records found.</td>
                </tr>
              ) : (
                filtered.map(r => {
                  const d = new Date(r.checked_in_at)
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={r.member_name} size="sm" />
                          <span className="font-medium">{r.member_name}</span>
                        </div>
                      </td>
                      <td className="text-muted">
                        {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="text-muted font-mono text-sm">
                        {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
