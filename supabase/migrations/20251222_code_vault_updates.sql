
-- Update Code Files table to include version notes
alter table public.code_files add column if not exists note text;
