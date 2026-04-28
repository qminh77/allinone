export type AiAdapter = 'openai_responses' | 'openai_chat' | 'openai_compatible' | 'gemini' | 'anthropic'

export type AiCapability = 'text' | 'json' | 'vision' | 'reasoning' | 'tools'

export interface AiProviderConfig {
    id: string
    name: string
    slug: string
    adapter: AiAdapter
    base_url: string
    encrypted_api_key: string | null
    is_enabled: boolean
}

export interface AiModelConfig {
    id: string
    provider_id: string
    name: string
    model_id: string
    capabilities: string[]
    request_defaults: Record<string, unknown>
    is_enabled: boolean
    is_default: boolean
    ai_providers: AiProviderConfig | null
}

export interface GenerateTextInput {
    featureKey: string
    userId?: string | null
    modelDbId?: string | null
    capability?: AiCapability
    system?: string
    prompt: string
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
}

export interface GenerateTextResult {
    text: string
    providerId: string
    modelId: string
    providerName: string
    modelName: string
}
