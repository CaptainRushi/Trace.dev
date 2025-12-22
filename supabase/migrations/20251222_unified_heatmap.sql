
-- Migration: Unified Heatmap (Tasks + Logs)

-- 1. Add status details to daily_logs
create type log_status as enum ('draft', 'submitted');

alter table public.daily_logs 
  add column if not exists status log_status default 'draft',
  add column if not exists submitted_at timestamptz;

-- 2. Backfill existing logs as submitted (assuming legacy logs represent finished work)
update public.daily_logs 
set status = 'submitted', submitted_at = created_at
where status = 'draft';
-- Note: 'default draft' populated the column with 'draft' on creation.

-- 3. Indexes for performance
create index if not exists idx_daily_logs_status_date on public.daily_logs(status, log_date);
