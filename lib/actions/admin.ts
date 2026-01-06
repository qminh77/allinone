'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { modules } from '@/config/modules'
// Helper to get all module keys
export async function getModuleStatuses() {
    const supabase = await createClient()

    // Fetch all settings that start with 'module:'
    // Since 'settings' table structure is likely key-value, we query keys.
    // Assuming 'settings' table: key (text), value (jsonb)

    // We want to verify which ones are explicitly disabled. 
    // Default is ENABLED if not present, usually.

    const keys = modules.map(m => `module:${m.key}:enabled`)

    const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', keys)

    const statusMap: Record<string, boolean> = {}

    // Default all to true first
    modules.forEach(m => {
        statusMap[m.key] = true
    })

    // Overlay DB values
    data?.forEach((item: any) => {
        // extract module key 'module:xyz:enabled' -> 'xyz'
        const parts = item.key.split(':')
        if (parts.length === 3) {
            const moduleKey = parts[1]
            statusMap[moduleKey] = item.value?.enabled ?? true
        }
    })

    return statusMap
}

export async function toggleModuleStatus(moduleKey: string, enabled: boolean) {
    const supabase = await createClient()

    const dbKey = `module:${moduleKey}:enabled`
    const value = { enabled, updated_at: new Date().toISOString() }

    // Check if exists
    const { data } = await supabase.from('settings').select('key').eq('key', dbKey).single()

    let error
    if (data) {
        const { error: updateError } = await supabase
            .from('settings')
            .update({ value: value as any })
            .eq('key', dbKey)
        error = updateError
    } else {
        const { error: insertError } = await supabase
            .from('settings')
            .insert({ key: dbKey, value: value as any })
        error = insertError
    }

    if (error) return { error: error.message }

    revalidatePath('/admin/modules')
    revalidatePath('/dashboard')
    revalidatePath('/tools') // In case we have a tools index

    return { success: true }
}
