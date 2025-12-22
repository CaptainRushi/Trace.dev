
-- Add profile columns to users table
alter table public.users add column if not exists username text;
alter table public.users add column if not exists bio text;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists updated_at timestamptz default now();

-- Add constraints
alter table public.users drop constraint if exists username_length;
alter table public.users add constraint username_length check (char_length(username) >= 3 and char_length(username) <= 20);

alter table public.users drop constraint if exists username_format;
alter table public.users add constraint username_format check (username ~ '^[a-z0-9_]+$');

alter table public.users drop constraint if exists bio_length;
alter table public.users add constraint bio_length check (char_length(bio) <= 200);

-- Unique Username
create unique index if not exists users_username_idx on public.users (username);

-- Updated_At Trigger
drop trigger if exists update_users_modtime on public.users;
create trigger update_users_modtime
  before update on public.users
  for each row execute procedure update_updated_at_column();

-- UPDATE POLICY FOR USERS TABLE (Explicitly required for profile edits)
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Storage Setup for Avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage Policies
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check ( 
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
    and name like (auth.uid()::text || '.%')
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using ( 
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
    and name like (auth.uid()::text || '.%')
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using ( 
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
    and name like (auth.uid()::text || '.%')
  );
