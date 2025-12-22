-- Migration: Dashboard Updates
-- 1. Users table updates
alter table public.users add column if not exists username text;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists bio text;

-- 2. User Preferences for Pets
create table if not exists public.user_preferences (
  user_id uuid references public.users(id) on delete cascade primary key,
  pet_enabled boolean default true,
  pet_type text default 'cat', -- cat, robot, pixel
  pet_name text default 'Bit',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_preferences enable row level security;
create policy "Users can manage own preferences" on public.user_preferences
    for all using (auth.uid() = user_id);

-- 3. Tasks updates for Calendar
alter table public.tasks add column if not exists scheduled_date date; 
alter table public.tasks add column if not exists estimated_minutes int;

create index if not exists idx_tasks_scheduled_date on public.tasks(scheduled_date);

-- 4. Projects updates
alter table public.projects add column if not exists is_pinned boolean default false;
