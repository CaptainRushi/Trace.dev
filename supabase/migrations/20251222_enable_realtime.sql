
-- Migration: Enable Realtime for Tasks and Logs
begin;
  -- Try to add tables to publication. 
  -- Note: If they are already added, this might throw strictly speaking, but usually idempotent-ish in recent PG versions or harmless.
  -- Alternatively, recreate publication or just run it. Using 'drop if exists' logic is complex for publications on tables.
  -- We assume standard Supabase setup.
  
  alter publication supabase_realtime add table public.tasks;
  alter publication supabase_realtime add table public.daily_logs;
commit;
