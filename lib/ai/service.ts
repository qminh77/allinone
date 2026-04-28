import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/encryption'
import type { AiAdapter, AiCapability, AiModelConfig, GenerateTextInput, GenerateTextResult } from '@/lib/ai/types'

const DEFAULT_TIMEOUT_MS = 60_000
const DEFAULT_MAX_TOKENS = 1600
const DEFAULT_TEMPERATURE = 0.35

function normalizeBaseUrl(baseUrl: string) {
    return baseUrl.replace(/\/+$/, '')
}

function numberFromUnknown(value: unknown, fallback: number) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function requestDefaults(model: AiModelConfig) {
    return model.request_defaults && typeof model.request_defaults === 'object'
        ? model.request_defaults
        : {}
}

function buildPrompt(input: GenerateTextInput) {
    if (!input.jsonMode) return input.prompt
    return `${input.prompt.trim()}\n\nReturn strictly valid JSON only. Do not wrap the JSON in markdown fences.`
}

async function fetchJson(url: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            ...init,
            signal: controller.signal,
        })

        const text = await response.text()
        let data: any = null
        if (text) {
            try {
                data = JSON.parse(text)
            } catch {
                data = { raw: text }
            }
        }

        if (!response.ok) {
            const message = data?.error?.message || data?.message || text || `AI request failed with ${response.status}`
            throw new Error(message)
        }

        return data
    } finally {
        clearTimeout(timeout)
    }
}

function extractResponsesText(data: any) {
    if (typeof data?.output_text === 'string') return data.output_text

    const parts: string[] = []
    for (const item of data?.output || []) {
        for (const content of item?.content || []) {
            if (typeof content?.text === 'string') parts.push(content.text)
            if (typeof content?.output_text === 'string') parts.push(content.output_text)
        }
    }

    return parts.join('\n').trim()
}

function extractChatText(data: any) {
    return data?.choices?.[0]?.message?.content?.trim?.() || ''
}

function extractGeminiText(data: any) {
    const parts = data?.candidates?.[0]?.content?.parts || []
    return parts.map((part: any) => part?.text).filter(Boolean).join('\n').trim()
}

function extractAnthropicText(data: any) {
    return (data?.content || [])
        .map((item: any) => item?.type === 'text' ? item.text : '')
        .filter(Boolean)
        .join('\n')
        .trim()
}

function usageFromResponse(adapter: AiAdapter, data: any) {
    if (adapter === 'anthropic') {
        const inputTokens = data?.usage?.input_tokens
        const outputTokens = data?.usage?.output_tokens
        return {
            prompt_tokens: typeof inputTokens === 'number' ? inputTokens : null,
            completion_tokens: typeof outputTokens === 'number' ? outputTokens : null,
            total_tokens: typeof inputTokens === 'number' && typeof outputTokens === 'number' ? inputTokens + outputTokens : null,
        }
    }

    if (adapter === 'gemini') {
        const usage = data?.usageMetadata
        return {
            prompt_tokens: typeof usage?.promptTokenCount === 'number' ? usage.promptTokenCount : null,
            completion_tokens: typeof usage?.candidatesTokenCount === 'number' ? usage.candidatesTokenCount : null,
            total_tokens: typeof usage?.totalTokenCount === 'number' ? usage.totalTokenCount : null,
        }
    }

    const usage = data?.usage
    return {
        prompt_tokens: typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : null,
        completion_tokens: typeof usage?.completion_tokens === 'number' ? usage.completion_tokens : null,
        total_tokens: typeof usage?.total_tokens === 'number' ? usage.total_tokens : null,
    }
}

async function logUsage(params: {
    userId?: string | null
    providerId?: string | null
    modelId?: string | null
    featureKey: string
    status: 'success' | 'failed'
    errorMessage?: string | null
    usage?: ReturnType<typeof usageFromResponse>
}) {
    try {
        const admin = createAdminClient()
        await (admin as any).from('ai_usage_logs').insert({
            user_id: params.userId || null,
            provider_id: params.providerId || null,
            model_id: params.modelId || null,
            feature_key: params.featureKey,
            status: params.status,
            error_message: params.errorMessage || null,
            prompt_tokens: params.usage?.prompt_tokens ?? null,
            completion_tokens: params.usage?.completion_tokens ?? null,
            total_tokens: params.usage?.total_tokens ?? null,
        })
    } catch (error) {
        console.error('Failed to write AI usage log:', error)
    }
}

async function loadModel(modelDbId?: string | null, capability: AiCapability = 'text') {
    const admin = createAdminClient()
    const db = admin as any

    let query = db
        .from('ai_models')
        .select('*, ai_providers(*)')
        .eq('is_enabled', true)
        .order('is_default', { ascending: false })
        .order('sort_order', { ascending: true })

    if (modelDbId) {
        query = query.eq('id', modelDbId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const models = ((data || []) as AiModelConfig[]).filter((model) => {
        const provider = model.ai_providers
        return provider?.is_enabled === true
            && !!provider.encrypted_api_key
            && model.capabilities.includes(capability)
    })

    if (models.length === 0) {
        throw new Error('AI chưa được cấu hình model/provider khả dụng trong AdminCP.')
    }

    return models[0]
}

async function callResponsesApi(model: AiModelConfig, apiKey: string, input: GenerateTextInput) {
    const provider = model.ai_providers!
    const defaults = requestDefaults(model)
    const payload: Record<string, unknown> = {
        model: model.model_id,
        instructions: input.system || 'You are a helpful assistant.',
        input: buildPrompt(input),
        max_output_tokens: input.maxTokens ?? numberFromUnknown(defaults.max_output_tokens, DEFAULT_MAX_TOKENS),
        temperature: input.temperature ?? numberFromUnknown(defaults.temperature, DEFAULT_TEMPERATURE),
    }

    const data = await fetchJson(`${normalizeBaseUrl(provider.base_url)}/responses`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...defaults, ...payload }),
    })

    return { text: extractResponsesText(data), usage: usageFromResponse(provider.adapter, data) }
}

async function callChatApi(model: AiModelConfig, apiKey: string, input: GenerateTextInput) {
    const provider = model.ai_providers!
    const defaults = requestDefaults(model)
    const payload: Record<string, unknown> = {
        model: model.model_id,
        messages: [
            { role: 'system', content: input.system || 'You are a helpful assistant.' },
            { role: 'user', content: buildPrompt(input) },
        ],
        max_tokens: input.maxTokens ?? numberFromUnknown(defaults.max_tokens, DEFAULT_MAX_TOKENS),
        temperature: input.temperature ?? numberFromUnknown(defaults.temperature, DEFAULT_TEMPERATURE),
    }

    if (input.jsonMode) {
        payload.response_format = { type: 'json_object' }
    }

    const data = await fetchJson(`${normalizeBaseUrl(provider.base_url)}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...defaults, ...payload }),
    })

    return { text: extractChatText(data), usage: usageFromResponse(provider.adapter, data) }
}

async function callGeminiApi(model: AiModelConfig, apiKey: string, input: GenerateTextInput) {
    const provider = model.ai_providers!
    const defaults = requestDefaults(model)
    const generationConfig: Record<string, unknown> = {
        temperature: input.temperature ?? numberFromUnknown(defaults.temperature, DEFAULT_TEMPERATURE),
        maxOutputTokens: input.maxTokens ?? numberFromUnknown(defaults.maxOutputTokens, DEFAULT_MAX_TOKENS),
    }

    if (input.jsonMode) {
        generationConfig.responseMimeType = 'application/json'
    }

    const data = await fetchJson(`${normalizeBaseUrl(provider.base_url)}/models/${encodeURIComponent(model.model_id)}:generateContent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
            ...defaults,
            systemInstruction: { parts: [{ text: input.system || 'You are a helpful assistant.' }] },
            contents: [{ role: 'user', parts: [{ text: buildPrompt(input) }] }],
            generationConfig,
        }),
    })

    return { text: extractGeminiText(data), usage: usageFromResponse(provider.adapter, data) }
}

async function callAnthropicApi(model: AiModelConfig, apiKey: string, input: GenerateTextInput) {
    const provider = model.ai_providers!
    const defaults = requestDefaults(model)
    const payload = {
        model: model.model_id,
        system: input.system || 'You are a helpful assistant.',
        messages: [{ role: 'user', content: buildPrompt(input) }],
        max_tokens: input.maxTokens ?? numberFromUnknown(defaults.max_tokens, DEFAULT_MAX_TOKENS),
        temperature: input.temperature ?? numberFromUnknown(defaults.temperature, DEFAULT_TEMPERATURE),
    }

    const data = await fetchJson(`${normalizeBaseUrl(provider.base_url)}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': String(defaults.anthropic_version || '2023-06-01'),
        },
        body: JSON.stringify({ ...defaults, ...payload }),
    })

    return { text: extractAnthropicText(data), usage: usageFromResponse(provider.adapter, data) }
}

function parseJsonText<T>(text: string): T {
    const trimmed = text.trim()
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/i, '')
        .trim()

    try {
        return JSON.parse(trimmed) as T
    } catch {
        const objectStart = trimmed.indexOf('{')
        const arrayStart = trimmed.indexOf('[')
        const start = objectStart === -1 ? arrayStart : arrayStart === -1 ? objectStart : Math.min(objectStart, arrayStart)
        const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'))

        if (start >= 0 && end > start) {
            return JSON.parse(trimmed.slice(start, end + 1)) as T
        }

        throw new Error('AI response is not valid JSON.')
    }
}

export async function generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    let model: AiModelConfig | null = null

    try {
        model = await loadModel(input.modelDbId, input.capability || (input.jsonMode ? 'json' : 'text'))
        const provider = model.ai_providers
        if (!provider?.encrypted_api_key) {
            throw new Error('Provider chưa có API key.')
        }

        const apiKey = decrypt(provider.encrypted_api_key)
        let result: { text: string; usage: ReturnType<typeof usageFromResponse> }

        if (provider.adapter === 'openai_responses') {
            result = await callResponsesApi(model, apiKey, input)
        } else if (provider.adapter === 'gemini') {
            result = await callGeminiApi(model, apiKey, input)
        } else if (provider.adapter === 'anthropic') {
            result = await callAnthropicApi(model, apiKey, input)
        } else {
            result = await callChatApi(model, apiKey, input)
        }

        if (!result.text) {
            throw new Error('AI provider returned an empty response.')
        }

        await logUsage({
            userId: input.userId,
            providerId: provider.id,
            modelId: model.id,
            featureKey: input.featureKey,
            status: 'success',
            usage: result.usage,
        })

        return {
            text: result.text,
            providerId: provider.id,
            modelId: model.id,
            providerName: provider.name,
            modelName: model.name,
        }
    } catch (error) {
        await logUsage({
            userId: input.userId,
            providerId: model?.ai_providers?.id,
            modelId: model?.id,
            featureKey: input.featureKey,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        })

        throw error
    }
}

export async function generateJson<T>(input: GenerateTextInput): Promise<T> {
    const result = await generateText({ ...input, jsonMode: true, capability: input.capability || 'json' })
    return parseJsonText<T>(result.text)
}

export async function getPublicAiModels() {
    const admin = createAdminClient()
    const { data, error } = await (admin as any)
        .from('ai_models')
        .select('id, name, model_id, capabilities, is_default, ai_providers(id, name, slug, is_enabled, encrypted_api_key)')
        .eq('is_enabled', true)
        .order('is_default', { ascending: false })
        .order('sort_order', { ascending: true })

    if (error) return []

    return (data || [])
        .filter((model: any) => model.ai_providers?.is_enabled && model.ai_providers?.encrypted_api_key)
        .map((model: any) => ({
            id: model.id,
            name: model.name,
            modelId: model.model_id,
            providerName: model.ai_providers.name,
            providerSlug: model.ai_providers.slug,
            capabilities: model.capabilities || [],
            isDefault: model.is_default,
        }))
}
