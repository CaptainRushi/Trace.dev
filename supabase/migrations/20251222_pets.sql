
-- User Pets Table
create table if not exists public.user_pets (
    user_id uuid references public.users(id) on delete cascade primary key,
    pet_type text not null default 'robot',
    pet_name text not null default 'Companion',
    enabled boolean not null default true,
    last_reacted_at timestamptz,
    created_at timestamptz default now(),
    position_x integer default 20,
    position_y integer default 20
);

-- RLS
alter table public.user_pets enable row level security;

drop policy if exists "Users can manage own pet" on public.user_pets;
create policy "Users can manage own pet"
  on public.user_pets for all
  using (auth.uid() = user_id);

-- Migration safety for existing table
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'user_pets' and column_name = 'position_x') then
    alter table public.user_pets add column position_x integer default 20;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'user_pets' and column_name = 'position_y') then
    alter table public.user_pets add column position_y integer default 20;
  end if;
end $$;
