-- Create SMTP Configs table
create table if not exists smtp_configs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  host text not null,
  port integer not null,
  secure boolean default false,
  username text,
  password text,
  from_email text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create Mail History table
create table if not exists mail_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  config_id uuid references smtp_configs(id) on delete set null,
  recipients text[] not null,
  subject text not null,
  body text,
  status text not null check (status in ('success', 'failed')),
  error_message text,
  sent_at timestamptz default now()
);

-- Enable RLS
alter table smtp_configs enable row level security;
alter table mail_history enable row level security;

-- Policies for smtp_configs
create policy "Users can view their own smtp configs"
  on smtp_configs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own smtp configs"
  on smtp_configs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own smtp configs"
  on smtp_configs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own smtp configs"
  on smtp_configs for delete
  using (auth.uid() = user_id);

-- Policies for mail_history
create policy "Users can view their own mail history"
  on mail_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own mail history"
  on mail_history for insert
  with check (auth.uid() = user_id);

-- No update/delete for history usually, but maybe delete is okay
create policy "Users can delete their own mail history"
  on mail_history for delete
  using (auth.uid() = user_id);
