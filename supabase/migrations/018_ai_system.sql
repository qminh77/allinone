-- Migration 018: Dynamic AI provider/model management
-- AI keys are encrypted by the application before being stored.

create table if not exists public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  adapter text not null,
  base_url text not null,
  docs_url text,
  api_key_label text,
  encrypted_api_key text,
  is_enabled boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint ai_providers_name_unique unique (name),
  constraint ai_providers_slug_check check (slug ~ '^[a-z0-9][a-z0-9_-]*[a-z0-9]$'),
  constraint ai_providers_adapter_check check (adapter in ('openai_responses', 'openai_chat', 'openai_compatible', 'gemini', 'anthropic')),
  constraint ai_providers_base_url_check check (base_url ~ '^https?://')
);

create table if not exists public.ai_models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.ai_providers(id) on delete cascade,
  name text not null,
  model_id text not null,
  description text,
  capabilities text[] not null default array['text', 'json']::text[],
  context_window integer,
  input_price_per_million numeric(12, 4),
  output_price_per_million numeric(12, 4),
  currency text not null default 'USD',
  request_defaults jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_models_provider_model_unique unique (provider_id, model_id),
  constraint ai_models_model_id_check check (char_length(trim(model_id)) between 1 and 160),
  constraint ai_models_name_check check (char_length(trim(name)) between 1 and 160),
  constraint ai_models_context_window_check check (context_window is null or context_window > 0),
  constraint ai_models_input_price_check check (input_price_per_million is null or input_price_per_million >= 0),
  constraint ai_models_output_price_check check (output_price_per_million is null or output_price_per_million >= 0),
  constraint ai_models_request_defaults_object_check check (jsonb_typeof(request_defaults) = 'object')
);

create unique index if not exists ai_models_single_default_idx
  on public.ai_models (is_default)
  where is_default = true;

create index if not exists ai_models_provider_idx on public.ai_models(provider_id);
create index if not exists ai_models_capabilities_idx on public.ai_models using gin(capabilities);

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  provider_id uuid references public.ai_providers(id) on delete set null,
  model_id uuid references public.ai_models(id) on delete set null,
  feature_key text not null,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  status text not null default 'success',
  error_message text,
  created_at timestamptz not null default now(),
  constraint ai_usage_logs_status_check check (status in ('success', 'failed')),
  constraint ai_usage_logs_tokens_check check (
    (prompt_tokens is null or prompt_tokens >= 0)
    and (completion_tokens is null or completion_tokens >= 0)
    and (total_tokens is null or total_tokens >= 0)
  )
);

create index if not exists ai_usage_logs_created_idx on public.ai_usage_logs(created_at desc);
create index if not exists ai_usage_logs_user_idx on public.ai_usage_logs(user_id, created_at desc);
create index if not exists ai_usage_logs_feature_idx on public.ai_usage_logs(feature_key, created_at desc);

drop trigger if exists update_ai_providers_updated_at on public.ai_providers;
create trigger update_ai_providers_updated_at before update on public.ai_providers
  for each row execute function update_updated_at_column();

drop trigger if exists update_ai_models_updated_at on public.ai_models;
create trigger update_ai_models_updated_at before update on public.ai_models
  for each row execute function update_updated_at_column();

alter table public.ai_providers enable row level security;
alter table public.ai_models enable row level security;
alter table public.ai_usage_logs enable row level security;

drop policy if exists "Only admins can read ai providers" on public.ai_providers;
create policy "Only admins can read ai providers"
  on public.ai_providers for select
  using (is_admin());

drop policy if exists "Only admins can manage ai providers" on public.ai_providers;
create policy "Only admins can manage ai providers"
  on public.ai_providers for all
  using (is_admin())
  with check (is_admin());

drop policy if exists "Only admins can read ai models" on public.ai_models;
create policy "Only admins can read ai models"
  on public.ai_models for select
  using (is_admin());

drop policy if exists "Only admins can manage ai models" on public.ai_models;
create policy "Only admins can manage ai models"
  on public.ai_models for all
  using (is_admin())
  with check (is_admin());

drop policy if exists "Only admins can read ai usage logs" on public.ai_usage_logs;
create policy "Only admins can read ai usage logs"
  on public.ai_usage_logs for select
  using (is_admin());

drop policy if exists "Only admins can manage ai usage logs" on public.ai_usage_logs;
create policy "Only admins can manage ai usage logs"
  on public.ai_usage_logs for all
  using (is_admin())
  with check (is_admin());

insert into public.ai_providers (name, slug, adapter, base_url, docs_url, api_key_label, is_enabled, sort_order)
values
  ('OpenAI', 'openai', 'openai_responses', 'https://api.openai.com/v1', 'https://platform.openai.com/docs/api-reference/responses', 'OPENAI_API_KEY', false, 10),
  ('KRouter', 'krouter', 'openai_responses', 'https://api.krouter.net/v1', 'https://krouter.net/docs', 'KROUTER_API_KEY', false, 20),
  ('Google Gemini', 'google-gemini', 'gemini', 'https://generativelanguage.googleapis.com/v1beta', 'https://ai.google.dev/gemini-api/docs', 'GEMINI_API_KEY', false, 30),
  ('Anthropic', 'anthropic', 'anthropic', 'https://api.anthropic.com/v1', 'https://docs.anthropic.com/en/api/messages', 'ANTHROPIC_API_KEY', false, 40),
  ('xAI Grok', 'xai-grok', 'openai_responses', 'https://api.x.ai/v1', 'https://docs.x.ai/docs/api-reference#responses', 'XAI_API_KEY', false, 50)
on conflict (slug) do update set
  name = excluded.name,
  adapter = excluded.adapter,
  base_url = excluded.base_url,
  docs_url = excluded.docs_url,
  api_key_label = excluded.api_key_label,
  sort_order = excluded.sort_order;

with provider_rows as (
  select id, slug from public.ai_providers where slug in ('openai', 'krouter', 'google-gemini', 'anthropic', 'xai-grok')
)
insert into public.ai_models (
  provider_id,
  name,
  model_id,
  description,
  capabilities,
  context_window,
  input_price_per_million,
  output_price_per_million,
  is_enabled,
  is_default,
  sort_order
)
select p.id, v.name, v.model_id, v.description, v.capabilities, v.context_window, v.input_price, v.output_price, true, false, v.sort_order
from provider_rows p
join (
  values
    ('openai', 'GPT-4.1', 'gpt-4.1', 'OpenAI general-purpose Responses model. Verify account availability in AdminCP before enabling.', array['text','json','reasoning']::text[], 1000000, null::numeric, null::numeric, 10),
    ('openai', 'GPT-4.1 Mini', 'gpt-4.1-mini', 'Lower-cost OpenAI Responses model. Verify account availability in AdminCP before enabling.', array['text','json','reasoning']::text[], 1000000, null::numeric, null::numeric, 20),
    ('krouter', 'GPT-5.5 via KRouter', 'gpt-5.5', 'KRouter OpenAI-compatible Responses model from docs/sample configuration.', array['text','json','reasoning']::text[], 1000000, null::numeric, null::numeric, 10),
    ('google-gemini', 'Gemini 2.5 Pro', 'gemini-2.5-pro', 'Gemini model supported by the generateContent API. Use ListModels in Google AI Studio if your account exposes a newer alias.', array['text','json','vision']::text[], 1000000, null::numeric, null::numeric, 10),
    ('google-gemini', 'Gemini 2.5 Flash', 'gemini-2.5-flash', 'Fast Gemini model supported by the generateContent API. Use ListModels in Google AI Studio if your account exposes a newer alias.', array['text','json','vision']::text[], 1000000, null::numeric, null::numeric, 20),
    ('anthropic', 'Claude Sonnet 4.6', 'claude-sonnet-4-6', 'Claude Messages API model. Edit model_id if Anthropic publishes date-suffixed aliases.', array['text','json','reasoning']::text[], 1000000, null::numeric, null::numeric, 10),
    ('anthropic', 'Claude Opus 4.7', 'claude-opus-4-7', 'Claude high-reasoning model. Edit model_id if Anthropic publishes date-suffixed aliases.', array['text','json','reasoning']::text[], 1000000, null::numeric, null::numeric, 20),
    ('xai-grok', 'Grok 4.20 Reasoning', 'grok-4.20-reasoning', 'xAI OpenAI-compatible Responses model from the current API docs.', array['text','json','reasoning']::text[], 2000000, null::numeric, null::numeric, 10)
) as v(slug, name, model_id, description, capabilities, context_window, input_price, output_price, sort_order)
  on p.slug = v.slug
on conflict (provider_id, model_id) do update set
  name = excluded.name,
  description = excluded.description,
  capabilities = excluded.capabilities,
  context_window = excluded.context_window,
  input_price_per_million = excluded.input_price_per_million,
  output_price_per_million = excluded.output_price_per_million,
  sort_order = excluded.sort_order;

insert into public.modules (key, name, description, icon, is_enabled, sort_order, href, category, is_new, is_popular)
values (
  'ai-assistant',
  'AI Assistant',
  'Tìm chức năng và hỗ trợ tạo nội dung cho mail, quiz, flashcard bằng model AI cấu hình động.',
  'ai-assistant',
  true,
  1,
  '/dashboard/ai',
  'AI',
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
