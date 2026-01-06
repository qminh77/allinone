/**
 * Protected Feature Component
 * 
 * Ẩn/hiện UI dựa trên quyền hạn của user
 * 
 * Sử dụng:
 * ```tsx
 * <ProtectedFeature permission="users.edit">
 *   <Button>Chỉnh sửa</Button>
 * </ProtectedFeature>
 * ```
 */

'use client'

import { usePermissions } from '@/lib/permissions/hooks'
import type { PermissionKey } from '@/types/permissions'

interface ProtectedFeatureProps {
    permission: PermissionKey
    fallback?: React.ReactNode
    children: React.ReactNode
}

export function ProtectedFeature({
    permission,
    fallback = null,
    children,
}: ProtectedFeatureProps) {
    const { hasPermission, loading } = usePermissions()

    if (loading) {
        return null // Hoặc skeleton
    }

    if (!hasPermission(permission)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

/**
 * Protected by Role
 */
interface ProtectedByRoleProps {
    role: string
    fallback?: React.ReactNode
    children: React.ReactNode
}

export function ProtectedByRole({
    role,
    fallback = null,
    children,
}: ProtectedByRoleProps) {
    const { hasRole, loading } = usePermissions()

    if (loading) {
        return null
    }

    if (!hasRole(role)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
