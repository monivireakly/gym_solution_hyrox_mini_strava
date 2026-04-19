# Hyrox Check-In App — Claude Code Scaffold

## Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (Postgres + Row Level Security)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (beta)
- **Fonts**: Google Fonts — `Syne` (display/headings) + `DM Sans` (body)

## Color Palette
```
--color-sea:       #006D77   (primary brand)
--color-sea-dark:  #004D54
--color-sea-light: #E8F4F5
--color-cyan:      #00C9D4   (accent / highlight)
--color-cyan-dim:  #83E0E5
--color-bg:        #F5FAFB   (page background)
--color-surface:   #FFFFFF
--color-text:      #0D2B2E
--color-muted:     #5A7F84
```

---

## File Structure

```
/
├── app/
│   ├── layout.tsx               # Root layout, global fonts + CSS vars
│   ├── page.tsx                 # Kiosk check-in screen (always-on QR landing)
│   ├── register/
│   │   └── page.tsx             # First-time member registration
│   ├── checkin/
│   │   └── [id]/
│   │       └── page.tsx         # Post check-in confirmation + streak
│   ├── leaderboard/
│   │   └── page.tsx             # Public weekly leaderboard
│   ├── profile/
│   │   └── [id]/
│   │       └── page.tsx         # Member public profile
│   └── admin/
│       ├── layout.tsx           # Admin auth guard
│       ├── page.tsx             # Dashboard overview
│       ├── members/
│       │   └── page.tsx         # Member list + CRUD
│       └── attendance/
│           └── page.tsx         # Attendance log + at-risk flags
├── components/
│   ├── Avatar.tsx               # Initials avatar with name-hash color
│   ├── StreakCalendar.tsx        # 365-day streak heatmap
│   ├── CheckInForm.tsx          # Last-4-digits input (numeric keypad)
│   ├── RegisterForm.tsx         # Name + last-4 registration form
│   └── LeaderboardRow.tsx       # Single leaderboard entry
├── lib/
│   ├── supabase.ts              # Supabase client (server + client)
│   ├── avatar.ts                # Avatar color hash utility
│   ├── streak.ts                # Streak calculation logic
│   └── atrisk.ts                # At-risk detection (14+ days inactive)
├── supabase/
│   └── schema.sql               # Full DB schema (paste into Supabase SQL editor)
├── .env.local.example           # Env var template
└── README.md                    # Setup instructions
```

---

## Supabase Schema (`supabase/schema.sql`)

```sql
-- Members table
create table members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  pin         char(4) not null,          -- last 4 digits of phone
  avatar_seed text generated always as (lower(name)) stored,
  created_at  timestamptz default now()
);

-- Attendance table
create table attendance (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references members(id) on delete cascade,
  checked_in_at timestamptz default now()
);

-- Indexes
create index on attendance(member_id);
create index on attendance(checked_in_at);

-- Row Level Security
alter table members enable row level security;
alter table attendance enable row level security;

-- Public can read members (for leaderboard/profiles)
create policy "public read members" on members for select using (true);

-- Public can insert attendance (check-in)
create policy "public insert attendance" on attendance for insert with check (true);

-- Public can read attendance (for streaks/leaderboard)
create policy "public read attendance" on attendance for select using (true);

-- Admin full access (use service_role key in admin routes)
```

---

## Key Components

### `lib/avatar.ts`
```ts
// Deterministic color from member name
const COLORS = [
  '#006D77', '#00C9D4', '#0E8C8C', '#005F6B',
  '#2A9D8F', '#48CAE4', '#0077B6', '#00B4D8',
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function avatarInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
```

### `lib/streak.ts`
```ts
// Returns current streak and total check-ins
export function calcStreak(dates: Date[]): { streak: number; total: number } {
  if (!dates.length) return { streak: 0, total: 0 };
  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  for (const d of sorted) {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor.getTime() - day.getTime()) / 86400000);
    if (diff === 0) { streak++; cursor.setDate(cursor.getDate() - 1); }
    else if (diff === 1) { streak++; cursor.setDate(cursor.getDate() - 1); }
    else break;
  }

  return { streak, total: dates.length };
}
```

### `lib/atrisk.ts`
```ts
// Returns members who haven't checked in for 14+ days
export function isAtRisk(lastCheckin: Date | null, days = 14): boolean {
  if (!lastCheckin) return true;
  const diffMs = Date.now() - lastCheckin.getTime();
  return diffMs > days * 24 * 60 * 60 * 1000;
}
```

---

## Page Descriptions

### `app/page.tsx` — Kiosk Screen
- Full-screen, always-on display
- Centered: gym logo/name, "Scan to check in" prompt
- Large numeric PIN pad (touch-friendly, min 64px buttons)
- On submit: lookup member by PIN → if multiple matches, show name selector → log attendance
- Auto-reset to idle after 8 seconds post check-in

### `app/register/page.tsx` — Registration
- Reached via `/register` link on kiosk screen ("First time? Register here")
- Fields: Full Name + Last 4 digits of phone
- On submit: creates member → redirects to `/checkin/[id]`
- Avatar preview shown live as name is typed

### `app/checkin/[id]/page.tsx` — Post Check-In
- Shows: avatar, name, "Welcome back!", current streak, total sessions
- Streak displayed as flame icon + number
- 365-day heatmap (StreakCalendar component)
- Leaderboard rank badge (e.g. "#4 this week")
- Auto-returns to `/` after 8 seconds with countdown

### `app/leaderboard/page.tsx` — Leaderboard
- Weekly (Mon–Sun) check-in count per member
- Top 10, ranked list with avatar + name + count
- Toggles: This Week / All Time

### `app/admin/page.tsx` — Admin Dashboard
- Protected by `ADMIN_SECRET` env var (simple header check for beta)
- Stats: total members, check-ins today, check-ins this week, at-risk count
- Quick links to members + attendance pages

### `app/admin/members/page.tsx` — Member Management
- Table: avatar, name, PIN (masked), joined date, last check-in, streak, status
- Actions: Edit name, Delete member
- At-risk members highlighted in amber
- Add member button (same fields as registration)

### `app/admin/attendance/page.tsx` — Attendance Log
- Full log: member name, check-in timestamp
- Filter by member or date range
- Export to CSV button

---

## Environment Variables (`.env.local.example`)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # admin routes only
ADMIN_SECRET=choose_a_strong_password
```

---

## Tailwind Config additions (`tailwind.config.ts`)
```ts
theme: {
  extend: {
    colors: {
      sea: {
        DEFAULT: '#006D77',
        dark: '#004D54',
        light: '#E8F4F5',
      },
      cyan: {
        brand: '#00C9D4',
        dim: '#83E0E5',
      },
    },
    fontFamily: {
      display: ['Syne', 'sans-serif'],
      body: ['DM Sans', 'sans-serif'],
    },
  },
},
```

---

## Global CSS additions (`app/globals.css`)
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

:root {
  --color-sea:       #006D77;
  --color-sea-dark:  #004D54;
  --color-sea-light: #E8F4F5;
  --color-cyan:      #00C9D4;
  --color-cyan-dim:  #83E0E5;
  --color-bg:        #F5FAFB;
  --color-surface:   #FFFFFF;
  --color-text:      #0D2B2E;
  --color-muted:     #5A7F84;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: 'DM Sans', sans-serif;
}

h1, h2, h3 {
  font-family: 'Syne', sans-serif;
}
```

---

## Setup Instructions

1. `npx create-next-app@latest hyrox-checkin --typescript --tailwind --app`
2. `npm install @supabase/supabase-js`
3. Create a Supabase project at supabase.com
4. Paste `supabase/schema.sql` into the Supabase SQL editor and run it
5. Copy `.env.local.example` to `.env.local` and fill in your Supabase keys
6. `npm run dev` — app runs at localhost:3000
7. Kiosk screen: open `localhost:3000` on your Mac mini, set Chrome to full-screen kiosk mode (`--kiosk` flag)
8. Deploy to Vercel: `vercel deploy`

## Mac Mini Kiosk Mode
```bash
# Launch Chrome in kiosk mode pointing at your Vercel URL
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  https://your-app.vercel.app
```

---

## Future Ideas (post-beta)
- SMS "we miss you" nudge at 14 days inactive (Twilio)
- Member photo upload to replace initials avatar
- Personal QR code per member (faster returning check-in)
- Class/session type tagging
- Monthly recap email with personal stats
