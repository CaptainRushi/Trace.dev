-- Create Tasks Table for "Daily Completed Task Heatmap"
do $$ begin
    create type task_status as enum ('pending', 'completed');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  status task_status default 'pending',
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Indexes
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_tasks_completed_at on public.tasks(completed_at);

-- RLS
alter table public.tasks enable row level security;

-- Drop existing policies if any (for idempotency in dev)
drop policy if exists "Users can full access own tasks" on public.tasks;

create policy "Users can full access own tasks"
  on public.tasks for all
  using (auth.uid() = user_id);

-- Trigger to set completed_at automatically
create or replace function public.handle_task_completion()
returns trigger as $$
begin
  if new.status = 'completed' and (old.status != 'completed' or old.status is null) and new.completed_at is null then
    new.completed_at = now();
  elseif new.status = 'pending' then
    new.completed_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_task_completion on public.tasks;
create trigger on_task_completion
  before update on public.tasks
  for each row execute procedure public.handle_task_completion();

-- Also for insert
drop trigger if exists on_task_insertion on public.tasks;
create trigger on_task_insertion
  before insert on public.tasks
  for each row execute procedure public.handle_task_completion();
