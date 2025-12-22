
alter table public.tasks 
add column if not exists scheduled_date date;

alter table public.tasks 
add column if not exists estimated_minutes integer;

create index if not exists idx_tasks_scheduled_date on public.tasks(scheduled_date);
