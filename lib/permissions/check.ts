/**
 * Permission Checking Utilities - Server Side
 * 
 * Các hàm kiểm tra quyền hạn cho Server Components và API Routes
 */

import { createClient } from '@/lib/supabase/server'
import type { PermissionKey } from '@/types/permissions'
import { cache } from 'react'

type UserAccess = {
    role: string | null
    permissions: string[]
}

const getUserAccess = cache(async (userId: string): Promise<UserAccess> => {
    const supabase = await createClient()

    const { data: profile } = (await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', userId)
        .single()) as { data: { role_id: string | null } | null }

    if (!profile?.role_id) {
        return { role: null, permissions: [] }
    }

    const [roleResult, rolePermsResult] = await Promise.all([
        supabase
            .from('roles')
            .select('name')
            .eq('id', profile.role_id)
            .single(),
        supabase
            .from('role_permissions')
            .select(`
      permissions (
        key
      )
    `)
            .eq('role_id', profile.role_id),
        ])

    const roleData = roleResult as { data?: { name?: string | null } | null }
    const rolePermsData = rolePermsResult as { data?: Array<{ permissions?: { key?: string | null } | null }> | null }

    const permissions = (rolePermsData.data || [])
        .map((rp: any) => rp.permissions?.key)
        .filter(Boolean)

    return {
        role: roleData.data?.name ?? null,
        permissions,
    }
})

/**
 * Kiểm tra user có permission cụ thể không
 * @param userId - ID của user cần kiểm tra
 * @param permissionKey - Key của permission (ví dụ: 'users.edit')
 * @returns true nếu user có quyền, false nếu không
 */
export async function hasPermission(
    userId: string,
    permissionKey: PermissionKey
): Promise<boolean> {
    const access = await getUserAccess(userId)
    return access.permissions.includes(permissionKey)
}

/**
 * Kiểm tra user có ít nhất 1 trong các permissions không
 */
export async function hasAnyPermission(
    userId: string,
    permissionKeys: PermissionKey[]
): Promise<boolean> {
    const access = await getUserAccess(userId)
    return permissionKeys.some(key => access.permissions.includes(key))
}

/**
 * Kiểm tra user có tất cả các permissions không
 */
export async function hasAllPermissions(
    userId: string,
    permissionKeys: PermissionKey[]
): Promise<boolean> {
    const access = await getUserAccess(userId)
    return permissionKeys.every(key => access.permissions.includes(key))
}

/**
 * Kiểm tra user có role cụ thể không
 * @param userId - ID của user
 * @param roleName - Tên role (ví dụ: 'Admin')
 */
export async function hasRole(
    userId: string,
    roleName: string
): Promise<boolean> {
    const access = await getUserAccess(userId)
    return access.role === roleName
}

/**
 * Lấy danh sách tất cả permissions của user
 */
export async function getUserPermissions(
    userId: string
): Promise<string[]> {
    const access = await getUserAccess(userId)
    return access.permissions
}

/**
 * Require permission - Throw error nếu không có quyền
 * Dùng trong API routes
 */
export async function requirePermission(
    userId: string,
    permissionKey: PermissionKey
): Promise<void> {
    const hasAccess = await hasPermission(userId, permissionKey)
    if (!hasAccess) {
        throw new Error(`Missing required permission: ${permissionKey}`)
    }
}

/**
 * Require role - Throw error nếu không có role
 */
export async function requireRole(
    userId: string,
    roleName: string
): Promise<void> {
    const hasRoleAccess = await hasRole(userId, roleName)
    if (!hasRoleAccess) {
        throw new Error(`Missing required role: ${roleName}`)
    }
}
