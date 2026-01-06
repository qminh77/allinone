/**
 * Supabase Client - Client Side
 * 
 * File này tạo Supabase client cho frontend (Client Components)
 * - Dùng NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - Dữ liệu được bảo vệ bằng Row Level Security (RLS)
 * - An toàn để dùng trong React components
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
