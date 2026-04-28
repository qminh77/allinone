'use server'

import { requireAdmin } from '@/lib/auth/authorization-middleware'
import { revalidatePath } from 'next/cache'
import { createAuditLog } from '@/lib/audit/log'
import { sanitizeInput } from '@/lib/validation'
import { createAdminDataClient } from '@/lib/admin/db'
import { z } from 'zod'

const CORE_SETTINGS = new Set(['allow_registration', 'allow_login'])
const SettingKeySchema = z.string()
    .trim()
    .min(3, 'Setting key is required')
    .max(80, 'Setting key is too long')
    .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/, 'Setting key can only contain lowercase letters, numbers, dot, underscore and hyphen')
const DescriptionSchema = z.string().trim().max(300, 'Description is too long').optional()
const VALUE_MAX_LENGTH = 8192

function parseJsonValue(valueText: string) {
    if (valueText.length > VALUE_MAX_LENGTH) {
        return { error: 'Setting value is too large' }
    }

    try {
        const value = JSON.parse(valueText)
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            return { error: 'Setting value must be a JSON object' }
        }

        return { value }
    } catch {
        return { error: 'Setting value must be valid JSON' }
    }
}

function parseSettingForm(formData: FormData) {
    const keyResult = SettingKeySchema.safeParse(String(formData.get('key') || ''))
    const descriptionResult = DescriptionSchema.safeParse(String(formData.get('description') || ''))
    const valueResult = parseJsonValue(String(formData.get('value') || ''))

    if (!keyResult.success) return { error: keyResult.error.issues[0].message }
    if (!descriptionResult.success) return { error: descriptionResult.error.issues[0].message }
    if (valueResult.error) return { error: valueResult.error }

    return {
        value: {
            key: keyResult.data,
            description: descriptionResult.data ? sanitizeInput(descriptionResult.data, 300) : null,
            value: valueResult.value!,
        },
    }
}

async function writeAuditLog(params: Parameters<typeof createAuditLog>[0]) {
    await createAuditLog(params)
}

export async function getSettings() {
    await requireAdmin()
    const supabase = await createAdminDataClient()
    const db = supabase as any

    const { data, error } = await db
        .from('settings')
        .select('key, value, description, updated_at, updated_by')
        .order('key')

    if (error) {
        console.error('Error fetching settings:', error)
        return []
    }

    return data || []
}

export async function createSetting(formData: FormData) {
    const currentUser = await requireAdmin()
    const parsed = parseSettingForm(formData)
    if (parsed.error) return { error: parsed.error }

    const supabase = await createAdminDataClient()
    const db = supabase as any
    const { data: existing } = await db
        .from('settings')
        .select('key')
        .eq('key', parsed.value!.key)
        .maybeSingle()

    if (existing) {
        return { error: 'Setting key already exists' }
    }

    const { error } = await db
        .from('settings')
        .insert({
            key: parsed.value!.key,
            value: parsed.value!.value,
            description: parsed.value!.description,
            updated_by: currentUser.id,
            updated_at: new Date().toISOString(),
        })

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'settings.update',
        resourceType: 'settings',
        metadata: { key: parsed.value!.key, operation: 'create' },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/settings')
    return { success: true }
}

export async function updateSetting(key: string, formData: FormData) {
    const currentUser = await requireAdmin()
    const keyResult = SettingKeySchema.safeParse(key)
    if (!keyResult.success) return { error: 'Invalid setting key' }

    const parsed = parseSettingForm(formData)
    if (parsed.error) return { error: parsed.error }

    if (CORE_SETTINGS.has(keyResult.data) && parsed.value!.key !== keyResult.data) {
        return { error: 'Core setting keys cannot be renamed' }
    }

    const supabase = await createAdminDataClient()
    const db = supabase as any

    if (parsed.value!.key !== keyResult.data) {
        const { data: existing } = await db
            .from('settings')
            .select('key')
            .eq('key', parsed.value!.key)
            .maybeSingle()

        if (existing) {
            return { error: 'Setting key already exists' }
        }
    }

    const { error } = await db
        .from('settings')
        .update({
            key: parsed.value!.key,
            value: parsed.value!.value,
            description: parsed.value!.description,
            updated_by: currentUser.id,
            updated_at: new Date().toISOString(),
        })
        .eq('key', keyResult.data)

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'settings.update',
        resourceType: 'settings',
        metadata: { key: keyResult.data, next_key: parsed.value!.key, operation: 'update' },
    })

    revalidatePath('/admin/settings')
    return { success: true }
}

export async function updateBooleanSetting(key: string, enabled: boolean) {
    const currentUser = await requireAdmin()
    const keyResult = SettingKeySchema.safeParse(key)
    if (!keyResult.success) return { error: 'Invalid setting key' }

    const supabase = await createAdminDataClient()
    const db = supabase as any
    const { error } = await db
        .from('settings')
        .upsert({
            key: keyResult.data,
            value: { enabled },
            updated_by: currentUser.id,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'settings.update',
        resourceType: 'settings',
        metadata: { key: keyResult.data, value: { enabled }, operation: 'toggle' },
    })

    revalidatePath('/admin/settings')
    return { success: true }
}

export async function deleteSetting(key: string) {
    const currentUser = await requireAdmin()
    const keyResult = SettingKeySchema.safeParse(key)
    if (!keyResult.success) return { error: 'Invalid setting key' }

    if (CORE_SETTINGS.has(keyResult.data)) {
        return { error: 'Core settings cannot be deleted' }
    }

    const supabase = await createAdminDataClient()
    const db = supabase as any
    const { error } = await db
        .from('settings')
        .delete()
        .eq('key', keyResult.data)

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'settings.update',
        resourceType: 'settings',
        metadata: { key: keyResult.data, operation: 'delete' },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/settings')
    return { success: true }
}
