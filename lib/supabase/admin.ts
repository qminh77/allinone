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

export function createAdminClient() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}
