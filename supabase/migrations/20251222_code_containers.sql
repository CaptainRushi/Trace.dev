
-- Code Containers Section

-- 1. Containers Table
create table if not exists public.code_containers (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  language text not null, 
  name text not null, 
  created_at timestamptz default now()
);

-- 2. Files Table
create table if not exists public.code_files (
  id uuid default uuid_generate_v4() primary key,
  container_id uuid references public.code_containers(id) on delete cascade not null,
  filename text not null,
  content text not null, 
  version int not null default 1,
  created_at timestamptz default now(),
  created_by uuid references public.users(id) default auth.uid()
);

-- Indexes (Use distinct names to avoid collisions if they exist, or check existence)
-- Simpler: Drop if exists then create
drop index if exists idx_code_containers_project;
create index idx_code_containers_project on public.code_containers(project_id);

drop index if exists idx_code_files_container;
create index idx_code_files_container on public.code_files(container_id);

drop index if exists idx_code_files_lookup;
create index idx_code_files_lookup on public.code_files(container_id, filename, version);

-- RLS: Containers
alter table public.code_containers enable row level security;

drop policy if exists "Users can manage own project containers" on public.code_containers;
create policy "Users can manage own project containers"
  on public.code_containers for all
  using (
    exists (
      select 1 from public.projects 
      where id = code_containers.project_id 
      and user_id = auth.uid()
    )
  );

-- RLS: Files
alter table public.code_files enable row level security;

drop policy if exists "Users can manage own project code files" on public.code_files;
create policy "Users can manage own project code files"
  on public.code_files for all
  using (
    exists (
      select 1 from public.code_containers c
      join public.projects p on p.id = c.project_id
      where c.id = code_files.container_id 
      and p.user_id = auth.uid()
    )
  );
