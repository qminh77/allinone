/**
 * Permission Hooks - Client Side
 * 
 * React hooks để kiểm tra quyền hạn trong Client Components
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PermissionKey, PermissionCheck } from '@/types/permissions'

type PermissionState = {
    userId: string | null
    permissions: string[]
    role: string | null
}

let permissionStateCache: PermissionState | null = null
let permissionStatePromise: Promise<PermissionState> | null = null

export function resetPermissionStateCache() {
    permissionStateCache = null
    permissionStatePromise = null
}

async function loadPermissionState(): Promise<PermissionState> {
    if (permissionStatePromise) return permissionStatePromise

    permissionStatePromise = (async () => {
        const supabase = createClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { userId: null, permissions: [], role: null }
        }

        if (permissionStateCache?.userId === user.id) {
            return permissionStateCache
        }

        const { data: profile } = (await supabase
            .from('user_profiles')
            .select('role_id')
            .eq('id', user.id)
            .single()) as { data: any }

        if (!profile?.role_id) {
            const state = { userId: user.id, permissions: [], role: null }
            permissionStateCache = state
            return state
        }

        const [roleResult, rolePermsResult] = await Promise.all([
            (supabase
                .from('roles')
                .select('name')
                .eq('id', profile.role_id)
                .single()) as any,
            supabase
                .from('role_permissions')
                .select(`
            permissions (
              key
            )
          `)
                .eq('role_id', profile.role_id),
        ])

        const state: PermissionState = {
            userId: user.id,
            role: roleResult.data?.name || null,
            permissions: (rolePermsResult.data || [])
                .map((rp: any) => rp.permissions?.key)
                .filter(Boolean),
        }
        permissionStateCache = state
        return state
    })().finally(() => {
        permissionStatePromise = null
    })

    return permissionStatePromise
}

/**
 * Hook kiểm tra permissions của user hiện tại
 * 
 * Sử dụng:
 * ```tsx
 * const { hasPermission, loading } = usePermissions()
 * 
 * if (loading) return <div>Loading...</div>
 * if (!hasPermission('users.edit')) return <div>Không có quyền</div>
 * ```
 */
export function usePermissions(): PermissionCheck {
    const [permissions, setPermissions] = useState<string[]>([])
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        loadPermissionState()
            .then(state => {
                if (!mounted) return
                setPermissions(state.permissions)
                setRole(state.role)
            })
            .catch(error => {
                console.error('Error loading permissions:', error)
                if (!mounted) return
                setPermissions([])
                setRole(null)
            })
            .finally(() => {
                if (mounted) setLoading(false)
            })

        return () => {
            mounted = false
        }
    }, [])

    const hasPermission = (key: PermissionKey): boolean => {
        return permissions.includes(key)
    }

    const hasAnyPermission = (keys: PermissionKey[]): boolean => {
        return keys.some(key => permissions.includes(key))
    }

    const hasAllPermissions = (keys: PermissionKey[]): boolean => {
        return keys.every(key => permissions.includes(key))
    }

    const hasRole = (roleName: string): boolean => {
        return role === roleName
    }

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        loading,
    }
}

/**
 * Hook kiểm tra role của user hiện tại
 */
export function useRole() {
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        loadPermissionState()
            .then(state => {
                if (mounted) setRole(state.role)
            })
            .catch(error => {
                console.error('Error loading role:', error)
                if (mounted) setRole(null)
            })
            .finally(() => {
                if (mounted) setLoading(false)
            })

        return () => {
            mounted = false
        }
    }, [])

    const hasRole = (roleName: string): boolean => {
        return role === roleName
    }

    const isAdmin = (): boolean => {
        return role === 'Admin'
    }

    return {
        role,
        hasRole,
        isAdmin,
        loading,
    }
}
