'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { modules } from '@/config/modules'
import { requireAdmin } from '@/lib/auth/authorization-middleware'
import { syncModuleCatalog } from '@/lib/modules/catalog'
import { getCachedModuleStatuses, revalidateModuleStatuses } from '@/lib/modules/status'

// Helper to get all module keys
export async function getModuleStatuses() {
    return getCachedModuleStatuses()
}

export async function toggleModuleStatus(moduleKey: string, enabled: boolean) {
    await requireAdmin()
    const supabase = await createClient()

    if (!modules.some(moduleItem => moduleItem.key === moduleKey)) {
        return { error: 'Unknown module key' }
    }

    await syncModuleCatalog()
    const moduleDef = modules.find(moduleItem => moduleItem.key === moduleKey)

    const { error } = await (supabase.from('modules') as any).upsert({
        key: moduleKey,
        name: moduleDef?.name || moduleKey,
        description: moduleDef?.description || null,
        icon: moduleKey,
        href: moduleDef?.href || `/tools/${moduleKey}`,
        category: moduleDef?.category || 'Utilities',
        is_enabled: enabled,
        sort_order: moduleDef ? modules.indexOf(moduleDef) + 1 : 0,
    }, { onConflict: 'key' })

    if (error) return { error: error.message }

    revalidateModuleStatuses()
    revalidatePath('/admin/modules')
    revalidatePath('/dashboard')
    revalidatePath('/tools')

    return { success: true }
}
