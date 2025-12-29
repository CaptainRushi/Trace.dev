-- Backfill public.users from auth.users
insert into public.users (id, email)
select id, email from auth.users
on conflict (id) do nothing;
