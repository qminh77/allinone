/**
 * Permission Hooks - Client Side
 * 
 * React hooks để kiểm tra quyền hạn trong Client Components
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PermissionKey, PermissionCheck } from '@/types/permissions'

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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadPermissions() {
            try {
                const supabase = createClient()

                // Lấy user hiện tại
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (!user) {
                    setLoading(false)
                    return
                }

                // Lấy profile và role
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('role_id')
                    .eq('id', user.id)
                    .single()

                if (!profile || !profile.role_id) {
                    setLoading(false)
                    return
                }

                // Lấy permissions của role
                const { data: rolePerms } = await supabase
                    .from('role_permissions')
                    .select(`
            permissions (
              key
            )
          `)
                    .eq('role_id', profile.role_id)

                if (rolePerms) {
                    const permKeys = rolePerms
                        .map((rp: any) => rp.permissions?.key)
                        .filter(Boolean)
                    setPermissions(permKeys)
                }
            } catch (error) {
                console.error('Error loading permissions:', error)
            } finally {
                setLoading(false)
            }
        }

        loadPermissions()
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

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
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
        async function loadRole() {
            try {
                const supabase = createClient()

                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (!user) {
                    setLoading(false)
                    return
                }

                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select(`
            role:roles (
              name
            )
          `)
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    // @ts-ignore
                    setRole(profile.role?.name || null)
                }
            } catch (error) {
                console.error('Error loading role:', error)
            } finally {
                setLoading(false)
            }
        }

        loadRole()
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
