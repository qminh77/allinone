-- Flow module: visual workflow builder and execution history

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft',
  definition jsonb not null default '{"version":1,"nodes":[],"edges":[]}'::jsonb,
  schedule_cron text,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflows_name_check check (char_length(trim(name)) between 3 and 160),
  constraint workflows_status_check check (status in ('draft', 'active', 'archived')),
  constraint workflows_definition_object_check check (jsonb_typeof(definition) = 'object')
);

create table if not exists public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued',
  trigger_type text not null default 'manual',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  error_message text,
  created_at timestamptz not null default now(),
  constraint workflow_executions_status_check check (status in ('queued', 'running', 'success', 'failed', 'cancelled')),
  constraint workflow_executions_trigger_type_check check (trigger_type in ('manual', 'schedule', 'api')),
  constraint workflow_executions_input_object_check check (jsonb_typeof(input) = 'object'),
  constraint workflow_executions_output_object_check check (output is null or jsonb_typeof(output) = 'object'),
  constraint workflow_executions_duration_check check (duration_ms is null or duration_ms >= 0)
);

create table if not exists public.workflow_execution_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.workflow_executions(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text,
  level text not null default 'info',
  message text not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  constraint workflow_execution_logs_level_check check (level in ('debug', 'info', 'warn', 'error')),
  constraint workflow_execution_logs_payload_object_check check (payload is null or jsonb_typeof(payload) = 'object')
);

create index if not exists idx_workflows_user_updated on public.workflows(user_id, updated_at desc);
create index if not exists idx_workflows_user_status on public.workflows(user_id, status);
create index if not exists idx_workflow_executions_workflow_created on public.workflow_executions(workflow_id, created_at desc);
create index if not exists idx_workflow_executions_user_created on public.workflow_executions(user_id, created_at desc);
create index if not exists idx_workflow_execution_logs_execution_created on public.workflow_execution_logs(execution_id, created_at asc);

drop trigger if exists update_workflows_updated_at on public.workflows;
create trigger update_workflows_updated_at before update on public.workflows
  for each row execute function update_updated_at_column();

alter table public.workflows enable row level security;
alter table public.workflow_executions enable row level security;
alter table public.workflow_execution_logs enable row level security;

drop policy if exists "Users can manage own workflows" on public.workflows;
create policy "Users can manage own workflows" on public.workflows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own workflow executions" on public.workflow_executions;
create policy "Users can manage own workflow executions" on public.workflow_executions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own workflow logs" on public.workflow_execution_logs;
create policy "Users can manage own workflow logs" on public.workflow_execution_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.workflow_execution_logs;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

insert into public.modules (key, name, description, icon, is_enabled, sort_order, href, category, is_new, is_popular)
values (
  'flow-builder',
  'Flow',
  'Visual workflow builder để tự động hóa API, bot, dữ liệu và tác vụ bằng canvas kéo-thả.',
  'flow-builder',
  true,
  2,
  '/flow',
  'Automation',
  true,
  true
)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  href = excluded.href,
  category = excluded.category,
  is_new = excluded.is_new,
  is_popular = excluded.is_popular;
