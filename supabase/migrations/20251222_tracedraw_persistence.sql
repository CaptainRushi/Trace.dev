
create table if not exists tracedraw_states (
  project_id uuid references projects(id) on delete cascade primary key,
  elements jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tracedraw_states enable row level security;

create policy "Users can view their project tracedraw states"
  on tracedraw_states for select
  using ( auth.uid() in ( select user_id from projects where id = tracedraw_states.project_id ) );

create policy "Users can insert/update their project tracedraw states"
  on tracedraw_states for insert
  with check ( auth.uid() in ( select user_id from projects where id = project_id ) );

create policy "Users can update their project tracedraw states"
  on tracedraw_states for update
  using ( auth.uid() in ( select user_id from projects where id = project_id ) );
