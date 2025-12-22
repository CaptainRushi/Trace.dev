
alter table public.code_containers 
add column if not exists source_type text default 'manual',
add column if not exists repo_url text,
add column if not exists repo_owner text,
add column if not exists repo_name text,
add column if not exists branch text,
add column if not exists commit_hash text,
add column if not exists last_synced_at timestamptz;

-- Ensure source_type is valid
alter table public.code_containers
add constraint check_source_type check (source_type in ('manual', 'github'));
