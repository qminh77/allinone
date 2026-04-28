import { unstable_cache, revalidateTag } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { modules } from '@/config/modules'

export const MODULE_STATUS_TAG = 'module-statuses'

function defaultStatusMap() {
    return modules.reduce<Record<string, boolean>>((acc, moduleItem) => {
        acc[moduleItem.key] = true
        return acc
    }, {})
}

async function loadModuleStatuses() {
    const statusMap = defaultStatusMap()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
        return statusMap
    }

    const supabase = createClient(url, anonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    const { data, error } = await supabase
        .from('modules')
        .select('key, is_enabled')

    if (error) {
        return statusMap
    }

    data?.forEach((item: any) => {
        if (typeof item.key === 'string') {
            statusMap[item.key] = item.is_enabled !== false
        }
    })

    return statusMap
}

export const getCachedModuleStatuses = unstable_cache(
    loadModuleStatuses,
    ['module-statuses'],
    {
        revalidate: 60,
        tags: [MODULE_STATUS_TAG],
    }
)

export function revalidateModuleStatuses() {
    revalidateTag(MODULE_STATUS_TAG, 'max')
}
