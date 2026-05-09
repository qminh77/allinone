/**
 * Auth Utilities - Session Management
 * 
 * Helper functions để làm việc với user authentication
 */

import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import { cache } from 'react'

/**
 * Lấy user hiện tại từ session
 * Dùng trong Server Components hoặc API Routes
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    return user
})

const getCurrentUserProfileById = cache(async (userId: string) => {
    const supabase = await createClient()

    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
      *,
      role:roles(*)
    `)
        .eq('id', userId)
        .single()

    if (error) {
        console.error('Error fetching user profile:', error)
        return null
    }

    return profile
})

/**
 * Lấy user profile (bảng user_profiles) của user hiện tại
 */
export const getCurrentUserProfile = cache(async (userId?: string): Promise<any> => {
    const resolvedUserId = userId || (await getCurrentUser())?.id
    if (!resolvedUserId) return null

    return getCurrentUserProfileById(resolvedUserId)
})

/**
 * Kiểm tra user có đăng nhập không
 */
export const isAuthenticated = cache(async (): Promise<boolean> => {
    const user = await getCurrentUser()
    return !!user
})

/**
 * Redirect về login nếu chưa đăng nhập
 */
export const requireAuth = cache(async () => {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
        throw new Error('Unauthorized - Please login')
    }
    return await getCurrentUser()
})
