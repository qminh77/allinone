import { unstable_cache, revalidateTag } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import {
    getFallbackModuleCatalog,
    modules as fallbackModules,
    toModuleCatalogItem,
    type ModuleCatalogItem,
} from '@/config/modules'
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

const SYNC_CHUNK_SIZE = 100
export const MODULE_CATALOG_TAG = 'module-catalog'

type ModuleRow = Database['public']['Tables']['modules']['Row']
type ModuleInsert = Database['public']['Tables']['modules']['Insert']

const fallbackCatalog = getFallbackModuleCatalog()
const fallbackByKey = new Map(fallbackCatalog.map(moduleItem => [moduleItem.key, moduleItem]))
const fallbackSortOrderByKey = new Map(fallbackCatalog.map(moduleItem => [moduleItem.key, moduleItem.sortOrder]))

function sortCatalog(a: ModuleCatalogItem, b: ModuleCatalogItem) {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name)
}

function normalizeModuleRow(row: ModuleRow): ModuleCatalogItem | null {
    const fallback = fallbackByKey.get(row.key)
    const href = row.href || fallback?.href

    if (!href) {
        return null
    }

    const fallbackSortOrder = fallbackSortOrderByKey.get(row.key) ?? Number.MAX_SAFE_INTEGER

    return {
        key: row.key,
        name: row.name || fallback?.name || row.key,
        description: row.description || fallback?.description || '',
        href,
        icon: row.icon || fallback?.icon || row.key,
        category: row.category || fallback?.category || 'Utilities',
        permission: fallback?.permission,
        isNew: row.is_new ?? fallback?.isNew ?? false,
        isPopular: row.is_popular ?? fallback?.isPopular ?? false,
        isEnabled: row.is_enabled !== false,
        sortOrder: row.sort_order ?? fallbackSortOrder,
    }
}

function mergeCatalogRows(rows: ModuleRow[]) {
    const catalogByKey = new Map<string, ModuleCatalogItem>()

    rows.forEach(row => {
        const moduleItem = normalizeModuleRow(row)
        if (moduleItem) {
            catalogByKey.set(moduleItem.key, moduleItem)
        }
    })

    fallbackCatalog.forEach(moduleItem => {
        if (!catalogByKey.has(moduleItem.key)) {
            catalogByKey.set(moduleItem.key, moduleItem)
        }
    })

    return Array.from(catalogByKey.values()).sort(sortCatalog)
}

export function getModuleKeys() {
    return fallbackModules.map(moduleItem => moduleItem.key)
}

export function getModuleCatalogRows(): ModuleInsert[] {
    return fallbackModules.map((moduleItem, index) => ({
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

export async function syncModuleCatalog(options: { revalidate?: boolean } = {}) {
    if (!isAdminClientConfigured()) {
        return { skipped: true, reason: 'admin client is not configured' }
    }

    const supabase = createAdminClient()
    const rows = getModuleCatalogRows()

    for (let i = 0; i < rows.length; i += SYNC_CHUNK_SIZE) {
        const chunk = rows.slice(i, i + SYNC_CHUNK_SIZE)
        // Supabase generated types in this repo do not infer inserts for this table reliably.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('modules').upsert(chunk, { onConflict: 'key' })

        if (error) {
            console.warn('Failed to sync module catalog:', error.message)
            return { skipped: true, reason: error.message }
        }
    }

    if (options.revalidate !== false) {
        revalidateModuleCatalog()
    }
    return { synced: true, count: rows.length }
}

async function loadModuleCatalog() {
    await syncModuleCatalog({ revalidate: false })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
        return fallbackCatalog
    }

    const supabase = createClient<Database>(url, anonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    const { data, error } = await supabase
        .from('modules')
        .select('key, name, description, icon, is_enabled, sort_order, href, category, is_new, is_popular')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

    if (error || !data) {
        return fallbackCatalog
    }

    return mergeCatalogRows(data)
}

export const getCachedModuleCatalog = unstable_cache(
    loadModuleCatalog,
    ['module-catalog'],
    {
        revalidate: 60,
        tags: [MODULE_CATALOG_TAG],
    }
)

export async function getModuleCatalog() {
    return getCachedModuleCatalog()
}

export async function getModuleByKey(moduleKey: string) {
    const catalog = await getModuleCatalog()
    return catalog.find(moduleItem => moduleItem.key === moduleKey) || null
}

export async function getModuleByHref(href: string) {
    const catalog = await getModuleCatalog()
    return catalog.find(moduleItem => moduleItem.href === href) || null
}

export async function isKnownModuleKey(moduleKey: string) {
    return Boolean(await getModuleByKey(moduleKey))
}

export async function isEnabledModuleKey(moduleKey: string) {
    const moduleItem = await getModuleByKey(moduleKey)
    return Boolean(moduleItem && moduleItem.isEnabled !== false)
}

export function revalidateModuleCatalog() {
    revalidateTag(MODULE_CATALOG_TAG, 'max')
}

export function getFallbackModuleByKey(moduleKey: string) {
    const fallback = fallbackModules.find(moduleItem => moduleItem.key === moduleKey)
    return fallback ? toModuleCatalogItem(fallback, fallbackModules.indexOf(fallback)) : null
}
