import { getCachedModuleCatalog, revalidateModuleCatalog } from '@/lib/modules/catalog'

export const MODULE_STATUS_TAG = 'module-statuses'

export async function getCachedModuleStatuses() {
    const catalog = await getCachedModuleCatalog()

    return catalog.reduce<Record<string, boolean>>((acc, moduleItem) => {
        acc[moduleItem.key] = moduleItem.isEnabled !== false
        return acc
    }, {})
}

export function revalidateModuleStatuses() {
    revalidateModuleCatalog()
}
