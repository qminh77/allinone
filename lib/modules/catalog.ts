import { modules } from '@/config/modules'
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin'

const SYNC_CHUNK_SIZE = 100

export function getModuleKeys() {
    return modules.map(moduleItem => moduleItem.key)
}

export function getModuleCatalogRows() {
    return modules.map((moduleItem, index) => ({
        key: moduleItem.key,
        name: moduleItem.name,
        description: moduleItem.description,
        icon: moduleItem.key,
        href: moduleItem.href,
        category: moduleItem.category,
        is_new: moduleItem.isNew || false,
        is_popular: moduleItem.isPopular || false,
        sort_order: index + 1,
    }))
}

export async function syncModuleCatalog() {
    if (!isAdminClientConfigured()) {
        return { skipped: true, reason: 'admin client is not configured' }
    }

    const supabase = createAdminClient()
    const rows = getModuleCatalogRows()

    for (let i = 0; i < rows.length; i += SYNC_CHUNK_SIZE) {
        const chunk = rows.slice(i, i + SYNC_CHUNK_SIZE)
        const { error } = await (supabase.from('modules') as any).upsert(chunk, { onConflict: 'key' })

        if (error) {
            console.warn('Failed to sync module catalog:', error.message)
            return { skipped: true, reason: error.message }
        }
    }

    return { synced: true, count: rows.length }
}
