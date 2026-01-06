/**
 * Permission Checking Utilities - Server Side
 * 
 * Các hàm kiểm tra quyền hạn cho Server Components và API Routes
 */

import { createClient } from '@/lib/supabase/server'
import type { PermissionKey } from '@/types/permissions'

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
    const supabase = await createClient()

    // Lấy role của user
    const { data: profile } = (await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', userId)
        .single()) as { data: any }

    if (!profile || !profile.role_id) return false

    // Kiểm tra role này có permission không
    const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select(`
      permission_id,
      permissions (
        key
      )
    `)
        .eq('role_id', profile.role_id)

    if (!rolePerms) return false

    // Tìm xem có permission.key === permissionKey không
    return rolePerms.some(
        (rp: any) => rp.permissions?.key === permissionKey
    )
}

/**
 * Kiểm tra user có ít nhất 1 trong các permissions không
 */
export async function hasAnyPermission(
    userId: string,
    permissionKeys: PermissionKey[]
): Promise<boolean> {
    for (const key of permissionKeys) {
        if (await hasPermission(userId, key)) {
            return true
        }
    }
    return false
}

/**
 * Kiểm tra user có tất cả các permissions không
 */
export async function hasAllPermissions(
    userId: string,
    permissionKeys: PermissionKey[]
): Promise<boolean> {
    for (const key of permissionKeys) {
        if (!(await hasPermission(userId, key))) {
            return false
        }
    }
    return true
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
    const supabase = await createClient()

    // Query profile và role riêng biệt
    const { data: profile } = (await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', userId)
        .single()) as { data: any }

    if (!profile?.role_id) return false

    const { data: roleData } = (await supabase
        .from('roles')
        .select('name')
        .eq('id', profile.role_id)
        .single()) as { data: any }

    return roleData?.name === roleName
}

/**
 * Lấy danh sách tất cả permissions của user
 */
export async function getUserPermissions(
    userId: string
): Promise<string[]> {
    const supabase = await createClient()

    const { data: profile } = (await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', userId)
        .single()) as { data: any }

    if (!profile || !profile.role_id) return []

    const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select(`
      permissions (
        key
      )
    `)
        .eq('role_id', profile.role_id)

    if (!rolePerms) return []

    return rolePerms.map((rp: any) => rp.permissions?.key).filter(Boolean)
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
