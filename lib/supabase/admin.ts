/**
 * Supabase Admin Client
 * 
 * ⚠️ NGUY HIỂM - CHỈ DÙNG TRÊN SERVER!
 * 
 * File này tạo Supabase client với SERVICE_ROLE_KEY
 * - Bypass tất cả RLS policies
 * - Có quyền đọc/ghi toàn bộ database
 * - CHỈ dùng trong API routes khi cần làm việc admin
 * - KHÔNG BAO GIỜ import file này vào Client Components!
 * 
 * Use cases:
 * - Ghi audit logs (user không được tự ghi log)
 * - Admin tạo user
 * - Backup/restore database
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

function getServiceRoleKeyError(): string | null {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

    if (!key || key === 'your-service-role-key-here') {
        return 'Missing SUPABASE_SERVICE_ROLE_KEY. Set the Supabase service_role key in .env.local or Vercel environment variables.'
    }

    if (key.startsWith('eyJ')) {
        try {
            const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'))
            if (payload.role && payload.role !== 'service_role') {
                return `SUPABASE_SERVICE_ROLE_KEY must use the service_role key, not role "${payload.role}".`
            }
        } catch {
            return 'SUPABASE_SERVICE_ROLE_KEY is not a valid JWT service_role key.'
        }
    }

    return null
}

export function isAdminClientConfigured() {
    return getServiceRoleKeyError() === null
}

export function createAdminClient() {
    const configError = getServiceRoleKeyError()
    if (configError) {
        throw new Error(configError)
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()

    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}
