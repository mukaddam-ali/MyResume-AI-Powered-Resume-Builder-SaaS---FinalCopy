-- Create feedback table
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  message text not null,
  category text not null check (category in ('issue', 'idea', 'other')),
  rating integer,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.feedback enable row level security;

-- Allow public access to insert feedback (for anon users)
create policy "Allow public feedback submission"
  on public.feedback
  for insert
  with check (true);

-- Allow authenticated users to insert feedback
create policy "Allow authenticated feedback submission"
  on public.feedback
  for insert
  to authenticated
  with check (true);

-- Allow service_role (and admins) to view feedback
create policy "Allow admin view"
  on public.feedback
  for select
  to service_role
  using (true);

-- Create admin_whitelist table if not exists (simple approach for now)
create table if not exists public.admin_whitelist (
  email text primary key
);

-- Enable RLS for whitelist
alter table public.admin_whitelist enable row level security;

-- Allow read access to authenticated users (to check if they are admin)
create policy "Allow read whitelist"
  on public.admin_whitelist
  for select
  to authenticated
  using (true);
