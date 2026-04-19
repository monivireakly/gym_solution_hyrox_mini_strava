-- Members table
create table members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  pin         char(4) not null,
  avatar_seed text generated always as (lower(name)) stored,
  created_at  timestamptz default now()
);

-- Attendance table
create table attendance (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid references members(id) on delete cascade,
  checked_in_at timestamptz default now()
);

-- Indexes
create index on attendance(member_id);
create index on attendance(checked_in_at);

-- Row Level Security
alter table members enable row level security;
alter table attendance enable row level security;

-- Public can read members (for leaderboard/profiles)
create policy "public read members"
  on members for select using (true);

-- Public can insert members (registration)
create policy "public insert members"
  on members for insert with check (true);

-- Public can insert attendance (check-in)
create policy "public insert attendance"
  on attendance for insert with check (true);

-- Public can read attendance (for streaks/leaderboard)
create policy "public read attendance"
  on attendance for select using (true);

-- NOTE: Admin routes use the service_role key (bypasses RLS entirely).
-- No separate admin policy is needed — service_role has full access.
