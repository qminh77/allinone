/**
 * Authorization Middleware
 * 
 * Middleware functions để kiểm tra quyền hạn trong Server Actions
 * ⚠️ CHỈ dùng trong Server Actions ('use server')
 */

'use server'

import { getCurrentUser } from '@/lib/auth/session'
import { hasRole, hasPermission } from '@/lib/permissions/check'
import type { PermissionKey } from '@/types/permissions'

/**
 * Require user phải có role Admin
 * Throw error nếu không có quyền
 */
export async function requireAdmin() {
    const user = await getCurrentUser()

    if (!user) {
        throw new Error('Unauthorized: Please login')
    }

    const isAdmin = await hasRole(user.id, 'Admin')

    if (!isAdmin) {
        throw new Error('Forbidden: Admin role required')
    }

    return user
}

/**
 * Require user phải có permission cụ thể
 * @param permission - Permission key cần kiểm tra
 */
export async function requirePermission(permission: PermissionKey) {
    const user = await getCurrentUser()

    if (!user) {
        throw new Error('Unauthorized: Please login')
    }

    const hasAccess = await hasPermission(user.id, permission)

    if (!hasAccess) {
        throw new Error(`Forbidden: ${permission} permission required`)
    }

    return user
}

/**
 * Require user phải đăng nhập
 * Không kiểm tra role hay permission cụ thể
 */
export async function requireAuthenticated() {
    const user = await getCurrentUser()

    if (!user) {
        throw new Error('Unauthorized: Please login')
    }

    return user
}

/**
 * Kiểm tra user có role cụ thể không (không throw error)
 * @returns true nếu có role, false nếu không
 */
export async function checkRole(roleName: string): Promise<boolean> {
    try {
        const user = await getCurrentUser()
        if (!user) return false

        return await hasRole(user.id, roleName)
    } catch {
        return false
    }
}

/**
 * Kiểm tra user có permission cụ thể không (không throw error)
 * @returns true nếu có permission, false nếu không
 */
export async function checkPermission(permission: PermissionKey): Promise<boolean> {
    try {
        const user = await getCurrentUser()
        if (!user) return false

        return await hasPermission(user.id, permission)
    } catch {
        return false
    }
}
