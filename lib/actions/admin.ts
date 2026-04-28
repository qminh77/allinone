'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/authorization-middleware'
import { getModuleByKey, syncModuleCatalog } from '@/lib/modules/catalog'
import { getCachedModuleStatuses, revalidateModuleStatuses } from '@/lib/modules/status'

// Helper to get all module keys
export async function getModuleStatuses() {
    return getCachedModuleStatuses()
}

export async function toggleModuleStatus(moduleKey: string, enabled: boolean) {
    await requireAdmin()
    const supabase = await createClient()

    await syncModuleCatalog()
    const moduleDef = await getModuleByKey(moduleKey)

    if (!moduleDef) {
        return { error: 'Unknown module key' }
    }

    const { error } = await (supabase.from('modules') as any).upsert({
        key: moduleKey,
        name: moduleDef.name,
        description: moduleDef.description || null,
        icon: moduleDef.icon || moduleKey,
        href: moduleDef.href,
        category: moduleDef.category,
        is_new: moduleDef.isNew,
        is_popular: moduleDef.isPopular,
        is_enabled: enabled,
        sort_order: moduleDef.sortOrder,
    }, { onConflict: 'key' })

    if (error) return { error: error.message }

    revalidateModuleStatuses()
    revalidatePath('/admin/modules')
    revalidatePath('/dashboard')
    revalidatePath('/tools')

    return { success: true }
}
