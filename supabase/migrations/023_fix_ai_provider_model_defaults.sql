-- Migration 022: Replace speculative AI model IDs with provider-supported defaults.
-- Existing encrypted API keys are not changed.

update public.ai_providers
set
  adapter = 'openai_responses',
  base_url = 'https://api.openai.com/v1',
  docs_url = 'https://platform.openai.com/docs/api-reference/responses',
  api_key_label = 'OPENAI_API_KEY'
where slug = 'openai';

update public.ai_providers
set
  adapter = 'openai_responses',
  base_url = 'https://api.krouter.net/v1',
  docs_url = 'https://krouter.net/docs',
  api_key_label = 'KROUTER_API_KEY'
where slug = 'krouter';

update public.ai_providers
set
  adapter = 'gemini',
  base_url = 'https://generativelanguage.googleapis.com/v1beta',
  docs_url = 'https://ai.google.dev/gemini-api/docs/models',
  api_key_label = 'GEMINI_API_KEY'
where slug = 'google-gemini';

update public.ai_providers
set
  adapter = 'anthropic',
  base_url = 'https://api.anthropic.com/v1',
  docs_url = 'https://docs.anthropic.com/en/docs/about-claude/models/overview',
  api_key_label = 'ANTHROPIC_API_KEY'
where slug = 'anthropic';

update public.ai_providers
set
  adapter = 'openai_responses',
  base_url = 'https://api.x.ai/v1',
  docs_url = 'https://docs.x.ai/docs/api-reference#responses',
  api_key_label = 'XAI_API_KEY'
where slug = 'xai-grok';

do $$
declare
  mapping record;
  source_id uuid;
  target_id uuid;
  source_was_default boolean;
begin
  for mapping in
    select * from (values
      ('openai', 'gpt-5.2', 'gpt-4.1', 'GPT-4.1', 'OpenAI general-purpose Responses model. Verify account availability in AdminCP before enabling.', 'text,json,reasoning', 1000000, 10),
      ('openai', 'gpt-5.2-mini', 'gpt-4.1-mini', 'GPT-4.1 Mini', 'Lower-cost OpenAI Responses model. Verify account availability in AdminCP before enabling.', 'text,json,reasoning', 1000000, 20),
      ('google-gemini', 'gemini-3-pro', 'gemini-2.5-pro', 'Gemini 2.5 Pro', 'Gemini model supported by the generateContent API. Use ListModels in Google AI Studio if your account exposes a newer alias.', 'text,json,vision', 1000000, 10),
      ('google-gemini', 'gemini-3-flash', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 'Fast Gemini model supported by the generateContent API. Use ListModels in Google AI Studio if your account exposes a newer alias.', 'text,json,vision', 1000000, 20),
      ('xai-grok', 'grok-4.20', 'grok-4.20-reasoning', 'Grok 4.20 Reasoning', 'xAI OpenAI-compatible Responses model from the current API docs.', 'text,json,reasoning', 2000000, 10)
    ) as m(slug, old_model_id, new_model_id, new_name, new_description, capabilities_csv, context_window, sort_order)
  loop
    select m.id, m.is_default
    into source_id, source_was_default
    from public.ai_models m
    join public.ai_providers p on p.id = m.provider_id
    where p.slug = mapping.slug and m.model_id = mapping.old_model_id
    limit 1;

    select m.id
    into target_id
    from public.ai_models m
    join public.ai_providers p on p.id = m.provider_id
    where p.slug = mapping.slug and m.model_id = mapping.new_model_id
    limit 1;

    if source_id is not null and target_id is null then
      update public.ai_models
      set
        name = mapping.new_name,
        model_id = mapping.new_model_id,
        description = mapping.new_description,
        capabilities = string_to_array(mapping.capabilities_csv, ',')::text[],
        context_window = mapping.context_window,
        sort_order = mapping.sort_order
      where id = source_id;
    elsif source_id is not null and target_id is not null then
      update public.ai_models
      set
        is_enabled = false,
        is_default = false,
        description = trim(coalesce(description, '') || ' Disabled because this seeded model ID is no longer valid for the provider API.')
      where id = source_id;

      if source_was_default then
        update public.ai_models set is_default = false where is_default = true;
        update public.ai_models set is_default = true, is_enabled = true where id = target_id;
      end if;
    end if;
  end loop;
end $$;

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
    ('anthropic', 'Claude Sonnet 4.6', 'claude-sonnet-4-6', 'Claude Messages API model.', array['text','json','reasoning']::text[], 1000000, null::numeric, null::numeric, 10),
    ('anthropic', 'Claude Opus 4.7', 'claude-opus-4-7', 'Claude high-reasoning model.', array['text','json','reasoning']::text[], 1000000, null::numeric, null::numeric, 20),
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
