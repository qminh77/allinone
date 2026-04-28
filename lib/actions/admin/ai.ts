'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/authorization-middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog } from '@/lib/audit/log'
import { encrypt } from '@/lib/encryption'
import { generateText } from '@/lib/ai/service'

const AdapterSchema = z.enum(['openai_responses', 'openai_chat', 'openai_compatible', 'gemini', 'anthropic'])
const IdSchema = z.string().uuid('Invalid ID')
const SlugSchema = z.string()
    .trim()
    .min(2, 'Slug is required')
    .max(64, 'Slug is too long')
    .regex(/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/, 'Slug can only contain lowercase letters, numbers, hyphen and underscore')
const UrlSchema = z.string().trim().url('URL không hợp lệ')
const OptionalUrlSchema = z.string().trim().optional().transform(value => value || null).pipe(z.string().url().nullable())
const OptionalTextSchema = z.string().trim().max(500).optional().transform(value => value || null)
const CapabilitiesSchema = z.string().trim().min(1).transform(value =>
    Array.from(new Set(value.split(',').map(item => item.trim().toLowerCase()).filter(Boolean)))
)

function booleanValue(value: FormDataEntryValue | null) {
    return value === 'true' || value === 'on'
}

function numberValue(value: FormDataEntryValue | null) {
    const text = String(value || '').trim()
    if (!text) return null
    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : null
}

function parseRequestDefaults(value: FormDataEntryValue | null) {
    const text = String(value || '').trim()
    if (!text) return {}

    try {
        const parsed = JSON.parse(text)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return { error: 'Request defaults phải là JSON object.' }
        }
        return { value: parsed }
    } catch {
        return { error: 'Request defaults không phải JSON hợp lệ.' }
    }
}

function sanitizeProvider(provider: any) {
    return {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        adapter: provider.adapter,
        base_url: provider.base_url,
        docs_url: provider.docs_url,
        api_key_label: provider.api_key_label,
        has_api_key: !!provider.encrypted_api_key,
        is_enabled: provider.is_enabled,
        sort_order: provider.sort_order,
        updated_at: provider.updated_at,
    }
}

async function audit(userId: string, action: Parameters<typeof createAuditLog>[0]['action'], resourceType: string, resourceId?: string, metadata?: Record<string, any>) {
    await createAuditLog({
        userId,
        action,
        resourceType,
        resourceId,
        metadata,
    })
}

export async function getAiAdminData() {
    await requireAdmin()
    const admin = createAdminClient()
    const db = admin as any

    const [providersResult, modelsResult, logsResult] = await Promise.all([
        db.from('ai_providers').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true }),
        db.from('ai_models').select('*, ai_providers(id, name, slug)').order('sort_order', { ascending: true }).order('name', { ascending: true }),
        db.from('ai_usage_logs')
            .select('*, ai_providers(name), ai_models(name, model_id)')
            .order('created_at', { ascending: false })
            .limit(30),
    ])

    if (providersResult.error) throw new Error(providersResult.error.message)
    if (modelsResult.error) throw new Error(modelsResult.error.message)
    if (logsResult.error) throw new Error(logsResult.error.message)

    return {
        providers: (providersResult.data || []).map(sanitizeProvider),
        models: modelsResult.data || [],
        usageLogs: logsResult.data || [],
    }
}

function parseProviderForm(formData: FormData) {
    const name = z.string().trim().min(2, 'Provider name is required').max(120).safeParse(formData.get('name'))
    const slug = SlugSchema.safeParse(formData.get('slug'))
    const adapter = AdapterSchema.safeParse(formData.get('adapter'))
    const baseUrl = UrlSchema.safeParse(formData.get('base_url'))
    const docsUrl = OptionalUrlSchema.safeParse(String(formData.get('docs_url') || ''))
    const apiKeyLabel = OptionalTextSchema.safeParse(String(formData.get('api_key_label') || ''))
    const sortOrder = numberValue(formData.get('sort_order')) ?? 0
    const apiKey = String(formData.get('api_key') || '').trim()

    if (!name.success) return { error: name.error.issues[0].message }
    if (!slug.success) return { error: slug.error.issues[0].message }
    if (!adapter.success) return { error: adapter.error.issues[0].message }
    if (!baseUrl.success) return { error: baseUrl.error.issues[0].message }
    if (!docsUrl.success) return { error: docsUrl.error.issues[0].message }
    if (!apiKeyLabel.success) return { error: apiKeyLabel.error.issues[0].message }

    return {
        value: {
            name: name.data,
            slug: slug.data,
            adapter: adapter.data,
            base_url: baseUrl.data.replace(/\/+$/, ''),
            docs_url: docsUrl.data,
            api_key_label: apiKeyLabel.data,
            api_key: apiKey,
            is_enabled: booleanValue(formData.get('is_enabled')),
            clear_api_key: booleanValue(formData.get('clear_api_key')),
            sort_order: sortOrder,
        },
    }
}

export async function createAiProvider(formData: FormData) {
    const user = await requireAdmin()
    const parsed = parseProviderForm(formData)
    if (parsed.error) return { error: parsed.error }

    const payload: Record<string, any> = {
        name: parsed.value!.name,
        slug: parsed.value!.slug,
        adapter: parsed.value!.adapter,
        base_url: parsed.value!.base_url,
        docs_url: parsed.value!.docs_url,
        api_key_label: parsed.value!.api_key_label,
        encrypted_api_key: parsed.value!.api_key ? encrypt(parsed.value!.api_key) : null,
        is_enabled: parsed.value!.is_enabled,
        sort_order: parsed.value!.sort_order,
        updated_by: user.id,
    }

    const { data, error } = await (createAdminClient() as any)
        .from('ai_providers')
        .insert(payload)
        .select('id, slug')
        .single()

    if (error) return { error: error.message }

    await audit(user.id, 'ai.provider.create', 'ai_provider', data.id, { slug: data.slug })
    revalidatePath('/admin/ai')
    return { success: true }
}

export async function updateAiProvider(providerId: string, formData: FormData) {
    const user = await requireAdmin()
    const id = IdSchema.safeParse(providerId)
    if (!id.success) return { error: 'Invalid provider id' }

    const parsed = parseProviderForm(formData)
    if (parsed.error) return { error: parsed.error }

    const payload: Record<string, any> = {
        name: parsed.value!.name,
        slug: parsed.value!.slug,
        adapter: parsed.value!.adapter,
        base_url: parsed.value!.base_url,
        docs_url: parsed.value!.docs_url,
        api_key_label: parsed.value!.api_key_label,
        is_enabled: parsed.value!.is_enabled,
        sort_order: parsed.value!.sort_order,
        updated_by: user.id,
    }

    if (parsed.value!.clear_api_key) {
        payload.encrypted_api_key = null
    } else if (parsed.value!.api_key) {
        payload.encrypted_api_key = encrypt(parsed.value!.api_key)
    }

    const { error } = await (createAdminClient() as any)
        .from('ai_providers')
        .update(payload)
        .eq('id', id.data)

    if (error) return { error: error.message }

    await audit(user.id, 'ai.provider.update', 'ai_provider', id.data, { slug: parsed.value!.slug })
    revalidatePath('/admin/ai')
    return { success: true }
}

export async function deleteAiProvider(providerId: string) {
    const user = await requireAdmin()
    const id = IdSchema.safeParse(providerId)
    if (!id.success) return { error: 'Invalid provider id' }

    const { error } = await (createAdminClient() as any)
        .from('ai_providers')
        .delete()
        .eq('id', id.data)

    if (error) return { error: error.message }

    await audit(user.id, 'ai.provider.delete', 'ai_provider', id.data)
    revalidatePath('/admin/ai')
    return { success: true }
}

export async function toggleAiProvider(providerId: string, enabled: boolean) {
    const user = await requireAdmin()
    const id = IdSchema.safeParse(providerId)
    if (!id.success) return { error: 'Invalid provider id' }

    const { error } = await (createAdminClient() as any)
        .from('ai_providers')
        .update({ is_enabled: enabled, updated_by: user.id })
        .eq('id', id.data)

    if (error) return { error: error.message }

    await audit(user.id, 'ai.provider.update', 'ai_provider', id.data, { enabled })
    revalidatePath('/admin/ai')
    return { success: true }
}

function parseModelForm(formData: FormData) {
    const providerId = IdSchema.safeParse(formData.get('provider_id'))
    const name = z.string().trim().min(1, 'Model name is required').max(160).safeParse(formData.get('name'))
    const modelId = z.string().trim().min(1, 'Model ID is required').max(160).safeParse(formData.get('model_id'))
    const description = OptionalTextSchema.safeParse(String(formData.get('description') || ''))
    const capabilities = CapabilitiesSchema.safeParse(formData.get('capabilities'))
    const requestDefaults = parseRequestDefaults(formData.get('request_defaults'))

    if (!providerId.success) return { error: 'Provider is required' }
    if (!name.success) return { error: name.error.issues[0].message }
    if (!modelId.success) return { error: modelId.error.issues[0].message }
    if (!description.success) return { error: description.error.issues[0].message }
    if (!capabilities.success) return { error: 'Capabilities are required' }
    if (requestDefaults.error) return { error: requestDefaults.error }

    return {
        value: {
            provider_id: providerId.data,
            name: name.data,
            model_id: modelId.data,
            description: description.data,
            capabilities: capabilities.data,
            context_window: numberValue(formData.get('context_window')),
            input_price_per_million: numberValue(formData.get('input_price_per_million')),
            output_price_per_million: numberValue(formData.get('output_price_per_million')),
            currency: String(formData.get('currency') || 'USD').trim().slice(0, 8) || 'USD',
            request_defaults: requestDefaults.value || {},
            is_enabled: booleanValue(formData.get('is_enabled')),
            is_default: booleanValue(formData.get('is_default')),
            sort_order: numberValue(formData.get('sort_order')) ?? 0,
        },
    }
}

async function clearDefaultModelExcept(modelId?: string) {
    let query = (createAdminClient() as any)
        .from('ai_models')
        .update({ is_default: false })
        .eq('is_default', true)

    if (modelId) {
        query = query.neq('id', modelId)
    }

    await query
}

export async function createAiModel(formData: FormData) {
    const user = await requireAdmin()
    const parsed = parseModelForm(formData)
    if (parsed.error) return { error: parsed.error }

    if (parsed.value!.is_default) {
        await clearDefaultModelExcept()
    }

    const { data, error } = await (createAdminClient() as any)
        .from('ai_models')
        .insert(parsed.value)
        .select('id, model_id')
        .single()

    if (error) return { error: error.message }

    await audit(user.id, 'ai.model.create', 'ai_model', data.id, { model_id: data.model_id })
    revalidatePath('/admin/ai')
    return { success: true }
}

export async function updateAiModel(modelDbId: string, formData: FormData) {
    const user = await requireAdmin()
    const id = IdSchema.safeParse(modelDbId)
    if (!id.success) return { error: 'Invalid model id' }

    const parsed = parseModelForm(formData)
    if (parsed.error) return { error: parsed.error }

    if (parsed.value!.is_default) {
        await clearDefaultModelExcept(id.data)
    }

    const { error } = await (createAdminClient() as any)
        .from('ai_models')
        .update(parsed.value)
        .eq('id', id.data)

    if (error) return { error: error.message }

    await audit(user.id, 'ai.model.update', 'ai_model', id.data, { model_id: parsed.value!.model_id })
    revalidatePath('/admin/ai')
    return { success: true }
}

export async function deleteAiModel(modelDbId: string) {
    const user = await requireAdmin()
    const id = IdSchema.safeParse(modelDbId)
    if (!id.success) return { error: 'Invalid model id' }

    const { error } = await (createAdminClient() as any)
        .from('ai_models')
        .delete()
        .eq('id', id.data)

    if (error) return { error: error.message }

    await audit(user.id, 'ai.model.delete', 'ai_model', id.data)
    revalidatePath('/admin/ai')
    return { success: true }
}

export async function toggleAiModel(modelDbId: string, enabled: boolean) {
    const user = await requireAdmin()
    const id = IdSchema.safeParse(modelDbId)
    if (!id.success) return { error: 'Invalid model id' }

    const { error } = await (createAdminClient() as any)
        .from('ai_models')
        .update({ is_enabled: enabled })
        .eq('id', id.data)

    if (error) return { error: error.message }

    await audit(user.id, 'ai.model.update', 'ai_model', id.data, { enabled })
    revalidatePath('/admin/ai')
    return { success: true }
}

export async function setDefaultAiModel(modelDbId: string) {
    const user = await requireAdmin()
    const id = IdSchema.safeParse(modelDbId)
    if (!id.success) return { error: 'Invalid model id' }

    await clearDefaultModelExcept(id.data)
    const { error } = await (createAdminClient() as any)
        .from('ai_models')
        .update({ is_default: true })
        .eq('id', id.data)

    if (error) return { error: error.message }

    await audit(user.id, 'ai.model.update', 'ai_model', id.data, { is_default: true })
    revalidatePath('/admin/ai')
    return { success: true }
}

export async function testAiModel(modelDbId: string) {
    const user = await requireAdmin()
    const id = IdSchema.safeParse(modelDbId)
    if (!id.success) return { error: 'Invalid model id' }

    try {
        const result = await generateText({
            featureKey: 'admin.ai.test',
            userId: user.id,
            modelDbId: id.data,
            system: 'You are testing an AI provider integration. Reply in Vietnamese with one short sentence.',
            prompt: 'Kiểm tra kết nối AI cho hệ thống Allinone.',
            maxTokens: 120,
            temperature: 0.1,
        })

        await audit(user.id, 'ai.model.test', 'ai_model', id.data, {
            provider: result.providerName,
            model: result.modelName,
        })

        return { success: true, text: result.text }
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Không thể kiểm tra model.' }
    }
}
