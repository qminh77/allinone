/**
 * Auth Utilities - Session Management
 * 
 * Helper functions để làm việc với user authentication
 */

import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Lấy user hiện tại từ session
 * Dùng trong Server Components hoặc API Routes
 */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    return user
}

/**
 * Lấy user profile (bảng user_profiles) của user hiện tại
 */
export async function getCurrentUserProfile(): Promise<any> {
    const user = await getCurrentUser()
    if (!user) return null

    // Use admin client to bypass RLS for fetching user's own profile
    // This is safe because we already verified auth above
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
      *,
      role:roles(*)
    `)
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Error fetching user profile:', error)
        return null
    }

    return profile
}

/**
 * Kiểm tra user có đăng nhập không
 */
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser()
    return !!user
}

/**
 * Redirect về login nếu chưa đăng nhập
 */
export async function requireAuth() {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
        throw new Error('Unauthorized - Please login')
    }
    return await getCurrentUser()
}
