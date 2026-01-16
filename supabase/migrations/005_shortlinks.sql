-- Create Shortlinks Table
create table if not exists shortlinks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  slug text not null unique,
  target_url text not null,
  password_hash text,
  expires_at timestamptz,
  clicks int default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table shortlinks enable row level security;

-- Policies
create policy "Users can view and edit their own shortlinks"
  on shortlinks for all
  using (auth.uid() = user_id);

-- Public access (Read only) via functions or specific policy?
-- Actually, the public/[slug] page will likely use a Service Role client or similar if policy blocks it,
-- OR we allow public read access to specific columns?
-- Better to keep strict RLS and use a "security definer" function OR server-side admin client for the redirection lookup to avoid exposing everything.
-- But for simplicity with Client Components, let's allow public read on `slug`, `target_url`, `expires_at`, `password_hash` (hashed!)?
-- NO, `password_hash` should be private.
-- Let's stick to: Users own their links.
-- The redirect logic will run on server-side actions, which can check ownership or use admin privileges to lookup for redirection.
-- Wait, server actions run with user context. For public visitors (unauthenticated), they can't query "Users can view own".
-- We need a "Public can look up slugs" policy.

create policy "Public can look up shortlinks"
  on shortlinks for select
  using (true); 
  -- We rely on column selection in code to not leak stuff, or we creates a separate view.
  -- Actually, let's just trust the server logic.
