import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function createAdminDataClient() {
    if (isAdminClientConfigured()) {
        return createAdminClient()
    }

    return createClient()
}

export function getActionErrorMessage(error: unknown, fallback = 'Admin action failed') {
    return error instanceof Error ? error.message : fallback
}
