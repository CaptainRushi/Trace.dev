
-- API Keys Vault Migration

create extension if not exists pgcrypto;

create table if not exists public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  platform text not null,
  name text not null,
  encrypted_value text not null, 
  created_at timestamptz default now()
);

alter table public.api_keys enable row level security;

drop policy if exists "Users can manage own project api keys" on public.api_keys;
create policy "Users can manage own project api keys"
  on public.api_keys for all
  using (
    exists (
      select 1 from public.projects 
      where id = api_keys.project_id 
      and user_id = auth.uid()
    )
  );

-- Function to create API Key (Encrypted)
create or replace function create_api_key(
  p_project_id uuid,
  p_platform text,
  p_name text,
  p_value text
) returns void as $$
begin
  -- Verify ownership of project
  if not exists (select 1 from public.projects where id = p_project_id and user_id = auth.uid()) then
    raise exception 'Access denied to project';
  end if;

  insert into public.api_keys (project_id, platform, name, encrypted_value)
  values (
    p_project_id, 
    p_platform, 
    p_name, 
    pgp_sym_encrypt(p_value, 'trace-app-secret-key') -- Using static key for this environment
  );
end;
$$ language plpgsql security definer;

-- Function to reveal API Key
create or replace function reveal_api_key(p_key_id uuid) returns text as $$
declare
  v_secret text;
begin
  -- Check ownership
  if not exists (
    select 1 from public.api_keys k
    join public.projects p on p.id = k.project_id
    where k.id = p_key_id and p.user_id = auth.uid()
  ) then
    raise exception 'Access denied';
  end if;

  select pgp_sym_decrypt(encrypted_value::bytea, 'trace-app-secret-key')
  into v_secret
  from public.api_keys
  where id = p_key_id;
  
  return v_secret;
end;
$$ language plpgsql security definer;
