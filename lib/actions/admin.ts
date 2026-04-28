'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { modules } from '@/config/modules'
import { requireAdmin } from '@/lib/auth/authorization-middleware'

// Helper to get all module keys
export async function getModuleStatuses() {
    const supabase = await createClient()

    const keys = modules.map(m => `module:${m.key}:enabled`)

    // Explicitly cast the response to avoid 'never' type inference issues
    const { data } = (await supabase
        .from('settings')
        .select('key, value')
        .in('key', keys)) as { data: { key: string; value: any }[] | null }

    const statusMap: Record<string, boolean> = {}

    // Default all to true first
    modules.forEach(m => {
        statusMap[m.key] = true
    })

    // Overlay DB values
    data?.forEach((item) => {
        const parts = item.key.split(':')
        if (parts.length === 3) {
            const moduleKey = parts[1]
            // Safe access to JSON value
            if (typeof item.value === 'object' && item.value !== null && 'enabled' in item.value) {
                statusMap[moduleKey] = (item.value as { enabled: boolean }).enabled
            }
        }
    })

    return statusMap
}

export async function toggleModuleStatus(moduleKey: string, enabled: boolean) {
    const user = await requireAdmin()
    const supabase = await createClient()

    if (!modules.some(moduleItem => moduleItem.key === moduleKey)) {
        return { error: 'Unknown module key' }
    }

    const dbKey = `module:${moduleKey}:enabled`
    const value = { enabled, updated_at: new Date().toISOString() }

    const { error } = await (supabase
        .from('settings') as any)
        .upsert({
            key: dbKey,
            value,
            description: `Enable/disable module ${moduleKey}`,
            updated_by: user.id,
        }, { onConflict: 'key' })

    if (error) return { error: error.message }

    revalidatePath('/admin/modules')
    revalidatePath('/dashboard')
    revalidatePath('/tools')

    return { success: true }
}
