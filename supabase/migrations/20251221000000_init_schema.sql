-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ====================================================
-- 1. USERS
-- ====================================================
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  created_at timestamptz default now()
);

-- RLS
alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- No update/delete policy for now unless requested, strict mapping.

-- ====================================================
-- 2. PROJECTS
-- ====================================================
create type project_status as enum ('active', 'paused', 'completed');

create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  tech_stack text[], -- array of strings for stack
  repo_url text,
  status project_status default 'active',
  created_at timestamptz default now()
);

-- Indexes
create index idx_projects_user on public.projects(user_id);

-- RLS
alter table public.projects enable row level security;

create policy "Users can full access own projects"
  on public.projects for all
  using (auth.uid() = user_id);

-- ====================================================
-- 3. PROJECT CONTAINERS
-- ====================================================
create table public.project_containers (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(project_id) -- One container per project
);

-- Indexes
create index idx_containers_user_project on public.project_containers(user_id, project_id);

-- RLS
alter table public.project_containers enable row level security;

create policy "Users can full access own containers"
  on public.project_containers for all
  using (auth.uid() = user_id);

-- ====================================================
-- 4. DAILY LOGS
-- ====================================================
create table public.daily_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  log_date date default current_date not null,
  worked_today text[],
  completed_today text[],
  not_completed text[],
  blockers text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, log_date)
);

-- Indexes
create index idx_daily_logs_user_project on public.daily_logs(user_id, project_id);
create index idx_daily_logs_date on public.daily_logs(log_date);

-- RLS
alter table public.daily_logs enable row level security;

create policy "Users can full access own logs"
  on public.daily_logs for all
  using (auth.uid() = user_id);

-- ====================================================
-- 5. API KEY PACKETS
-- ====================================================
create type env_type as enum ('dev', 'prod');

create table public.api_key_packets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  platform_name text not null,
  encrypted_payload text not null, -- Stores the encrypted blob
  environment env_type default 'dev',
  notes text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_api_keys_user_project on public.api_key_packets(user_id, project_id);

-- RLS
alter table public.api_key_packets enable row level security;

create policy "Users can full access own api packets"
  on public.api_key_packets for all
  using (auth.uid() = user_id);

-- ====================================================
-- 6. DATABASE DOCS
-- ====================================================
create table public.database_docs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  db_type text not null,
  schema_notes text,
  migration_notes text,
  table_notes text,
  updated_at timestamptz default now()
);

-- Indexes
create index idx_db_docs_user_project on public.database_docs(user_id, project_id);

-- RLS
alter table public.database_docs enable row level security;

create policy "Users can full access own db docs"
  on public.database_docs for all
  using (auth.uid() = user_id);

-- ====================================================
-- 7. CONTRIBUTION STATS
-- ====================================================
create table public.contribution_stats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  activity_date date not null,
  activity_score int not null default 0,
  created_at timestamptz default now(),
  unique(project_id, activity_date)
);

-- Indexes
create index idx_stats_user_project_date on public.contribution_stats(user_id, project_id, activity_date);

-- RLS
alter table public.contribution_stats enable row level security;

create policy "Users can read own stats"
  on public.contribution_stats for select
  using (auth.uid() = user_id);

-- Only system/edge functions should insert/update ideally, but if using client for calculations (not recommended by prompt), we allow it.
-- Prompt says: "Edge Functions for ... Contribution score calculation".
-- So we might restrict write access?
-- "A user can only read/write rows where user_id = auth.uid()" - General rule.
-- I will allow write for now matching strict separate ownership logic.
create policy "Users can write own stats"
  on public.contribution_stats for insert
  with check (auth.uid() = user_id);
  
create policy "Users can update own stats"
  on public.contribution_stats for update
  using (auth.uid() = user_id);

-- ====================================================
-- 8. IMPROVEMENT ENTRIES
-- ====================================================
create type improvement_category as enum ('improve', 'tomorrow', 'stop');

create table public.improvement_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  category improvement_category not null,
  content text not null,
  created_at timestamptz default now()
);

-- Indexes
create index idx_improvements_user_project on public.improvement_entries(user_id, project_id);

-- RLS
alter table public.improvement_entries enable row level security;

create policy "Users can full access own improvements"
  on public.improvement_entries for all
  using (auth.uid() = user_id);


-- ====================================================
-- TRIGGERS & FUNCTIONS
-- ====================================================

-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auth.users
-- Note: In older supabase versions or local dev this might need explicit creation on auth.users logic
-- but usually we assume we can add triggers to public tables or via migration on auth.
-- Supabase migrations allow this.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Automatic Updated_At
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_daily_logs_modtime
  before update on public.daily_logs
  for each row execute procedure update_updated_at_column();

create trigger update_db_docs_modtime
  before update on public.database_docs
  for each row execute procedure update_updated_at_column();

