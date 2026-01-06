/**
 * Supabase Server Client
 * 
 * File này tạo Supabase client cho server-side (Server Components, API Routes)
 * - Đọc session từ cookies
 * - Tự động refresh token
 * - Vẫn tuân thủ RLS policies
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Có thể bị lỗi trong Server Components
                        // Chỉ cần set cookies trong Server Actions hoặc Route Handlers
                    }
                },
            },
        }
    )
}
