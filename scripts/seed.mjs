/**
 * Seed script — inserts 20 test members + attendance history
 *
 * Usage:
 *   node scripts/seed.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local
 * (or from process.env if already exported).
 *
 * Safe to run multiple times — skips members that already exist by name.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

/* ── Load .env.local ────────────────────────────── */
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '..', '.env.local')
try {
  const raw = readFileSync(envPath, 'utf-8')
  for (const line of raw.split('\n')) {
    const [key, ...rest] = line.trim().split('=')
    if (key && !key.startsWith('#') && rest.length) {
      process.env[key] = rest.join('=').replace(/^["']|["']$/g, '')
    }
  }
} catch {
  console.log('No .env.local found — using process.env directly')
}

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

/* ── Member roster ──────────────────────────────── */
const MEMBERS = [
  { name: 'Alex Chen',      pin: '1001' },
  { name: 'Sarah Kim',      pin: '1002' },
  { name: 'Marcus Webb',    pin: '1003' },
  { name: 'Priya Nair',     pin: '1004' },
  { name: 'Jake Torres',    pin: '1005' },
  { name: 'Emma Larsson',   pin: '1006' },
  { name: 'Daniel Osei',    pin: '1007' },
  { name: 'Yuki Tanaka',    pin: '1008' },
  { name: 'Leila Ahmadi',   pin: '1009' },
  { name: 'Ben Russo',      pin: '1010' },
  { name: 'Chloe Martin',   pin: '1011' },
  { name: 'Oscar Müller',   pin: '1012' },
  { name: 'Aisha Brooks',   pin: '1013' },
  { name: 'Tom Ingram',     pin: '1014' },
  { name: 'Nina Petrov',    pin: '1015' },
  { name: 'Ravi Sharma',    pin: '1016' },
  { name: 'Fiona Walsh',    pin: '1017' },
  { name: 'Luca Ferrari',   pin: '1018' },
  { name: 'Hana Park',      pin: '1019' },
  { name: 'Theo Dupont',    pin: '1020' },
]

/* ── Attendance patterns ────────────────────────── */
// Each member gets a pattern that drives how many days/week they check in
// and whether they check in today.

const PATTERNS = [
  { daysBack: 60, freq: 5, checkInToday: true  }, // Alex   – almost daily
  { daysBack: 45, freq: 4, checkInToday: true  }, // Sarah
  { daysBack: 30, freq: 3, checkInToday: true  }, // Marcus
  { daysBack: 20, freq: 5, checkInToday: true  }, // Priya
  { daysBack: 14, freq: 2, checkInToday: true  }, // Jake
  { daysBack: 60, freq: 6, checkInToday: true  }, // Emma   – streak machine
  { daysBack: 10, freq: 3, checkInToday: true  }, // Daniel – newer member
  { daysBack: 90, freq: 4, checkInToday: true  }, // Yuki
  { daysBack: 7,  freq: 7, checkInToday: true  }, // Leila  – solid week
  { daysBack: 50, freq: 2, checkInToday: true  }, // Ben
  { daysBack: 30, freq: 5, checkInToday: false }, // Chloe  – NOT today
  { daysBack: 45, freq: 3, checkInToday: false }, // Oscar
  { daysBack: 60, freq: 4, checkInToday: false }, // Aisha
  { daysBack: 14, freq: 6, checkInToday: false }, // Tom
  { daysBack: 90, freq: 3, checkInToday: false }, // Nina
  { daysBack: 5,  freq: 5, checkInToday: false }, // Ravi   – recent starter
  { daysBack: 20, freq: 2, checkInToday: false }, // Fiona  – at risk soon
  { daysBack: 60, freq: 4, checkInToday: false }, // Luca
  { daysBack: 30, freq: 3, checkInToday: false }, // Hana
  { daysBack: 45, freq: 5, checkInToday: false }, // Theo
]

/* ── Helpers ────────────────────────────────────── */

function daysAgo(n, hourOffset = 8) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hourOffset + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0)
  return d.toISOString()
}

function todayAt(hourOffset = 6) {
  const d = new Date()
  // Stagger today's check-ins across the morning so they arrive at different "times ago"
  d.setHours(hourOffset + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0)
  return d.toISOString()
}

/** Build a list of unique past dates based on frequency (days/week) */
function buildHistory(daysBack, freqPerWeek) {
  const dates = []
  for (let i = 1; i <= daysBack; i++) {
    // Approximate: freq/7 chance each day, but skip today (handled separately)
    if (Math.random() < freqPerWeek / 7) {
      dates.push(daysAgo(i))
    }
  }
  return dates
}

/* ── Main ───────────────────────────────────────── */

async function run() {
  console.log('🌱  Starting seed…\n')

  // ── 1. Fetch existing members by name ──
  const { data: existing } = await db.from('members').select('name')
  const existingNames = new Set((existing ?? []).map(m => m.name))

  // ── 2. Insert new members ──
  const toInsert = MEMBERS.filter(m => !existingNames.has(m.name))
  let insertedIds = {}

  if (toInsert.length) {
    const { data, error } = await db
      .from('members')
      .insert(toInsert)
      .select('id, name')
    if (error) { console.error('Member insert error:', error); process.exit(1) }
    for (const m of data) insertedIds[m.name] = m.id
    console.log(`✅  Inserted ${data.length} members`)
  } else {
    console.log('ℹ️   All members already exist — skipping insert')
  }

  // ── 3. Fetch all member IDs (newly inserted + pre-existing) ──
  const { data: allMembers } = await db.from('members').select('id, name')
  const memberMap = {}
  for (const m of allMembers) memberMap[m.name] = m.id

  // ── 4. Build attendance records ──
  let totalRows = 0

  for (let i = 0; i < MEMBERS.length; i++) {
    const member   = MEMBERS[i]
    const pattern  = PATTERNS[i]
    const memberId = memberMap[member.name]

    if (!memberId) {
      console.warn(`  ⚠️  No ID found for ${member.name}, skipping`)
      continue
    }

    const historyDates = buildHistory(pattern.daysBack, pattern.freq)

    // Check for duplicate dates (same member_id + date)
    const { data: existingAttendance } = await db
      .from('attendance')
      .select('checked_in_at')
      .eq('member_id', memberId)

    const existingDays = new Set(
      (existingAttendance ?? []).map(a => a.checked_in_at.slice(0, 10))
    )

    const rows = historyDates
      .filter(d => !existingDays.has(d.slice(0, 10)))
      .map(checked_in_at => ({ member_id: memberId, checked_in_at }))

    // Today's check-in
    if (pattern.checkInToday) {
      const todayStr = new Date().toISOString().slice(0, 10)
      if (!existingDays.has(todayStr)) {
        rows.push({ member_id: memberId, checked_in_at: todayAt() })
      }
    }

    if (rows.length) {
      const { error } = await db.from('attendance').insert(rows)
      if (error) {
        console.error(`  ❌  Attendance error for ${member.name}:`, error.message)
      } else {
        totalRows += rows.length
        const todayMarker = pattern.checkInToday ? ' (checked in TODAY ✓)' : ''
        console.log(`  👤  ${member.name.padEnd(18)} — ${rows.length} sessions${todayMarker}`)
      }
    } else {
      console.log(`  👤  ${member.name.padEnd(18)} — already seeded, skipped`)
    }
  }

  console.log(`\n🎉  Done! Inserted ${totalRows} attendance rows total.`)
  console.log(`\nMembers checked in TODAY (will appear on TV ticker):`)
  MEMBERS.filter((_, i) => PATTERNS[i].checkInToday)
    .forEach(m => console.log(`   • ${m.name} (PIN: ${m.pin})`))
}

run().catch(err => { console.error(err); process.exit(1) })
