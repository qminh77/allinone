'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getRoles() {
    const supabase = await createClient()

    const { data } = await supabase
        .from('roles' as any)
        .select(`
            *,
            role_permissions (
                permission_id
            )
        `)
        .order('name')

    // Count permissions for each role
    const rolesWithCounts = (data || []).map((role: any) => ({
        ...role,
        permissions_count: role.role_permissions?.length || 0
    }))

    return rolesWithCounts
}

export async function getRole(id: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('roles' as any)
        .select(`
            *,
            role_permissions (
                permission_id,
                permissions (
                    id,
                    name,
                    key
                )
            )
        `)
        .eq('id', id)
        .single()

    return data
}

export async function createRole(formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name) {
        return { error: 'Role name is required' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('roles' as any)
        .insert({
            name,
            description: description || null
        } as any)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/roles')
    return { success: true, role: data }
}

export async function updateRole(id: string, formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    const supabase = await createClient()
    const { error } = await (supabase
        .from('roles' as any)
        .update({
            name,
            description: description || null
        } as any)
        .eq('id', id) as any)

    if (error) return { error: error.message }

    revalidatePath('/admin/roles')
    return { success: true }
}

export async function deleteRole(id: string) {
    const supabase = await createClient()

    // Check if role is a system role
    const { data: role } = await supabase
        .from('roles' as any)
        .select('name')
        .eq('id', id)
        .single()

    if (!role) return { error: 'Role not found' }

    // Prevent deletion of system roles
    if ((role as any).name === 'Admin' || (role as any).name === 'User') {
        return { error: 'Cannot delete system roles' }
    }

    // Check if users are assigned to this role
    const { data: users } = await supabase
        .from('user_profiles' as any)
        .select('id')
        .eq('role_id', id)
        .limit(1)

    if (users && users.length > 0) {
        return { error: 'Cannot delete role with active users' }
    }

    const { error } = await supabase
        .from('roles' as any)
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/roles')
    return { success: true }
}

export async function getRolePermissions(roleId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('role_permissions' as any)
        .select('permission_id')
        .eq('role_id', roleId)

    return (data || []).map((rp: any) => rp.permission_id)
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
    const supabase = await createClient()

    // Delete existing permissions
    await supabase
        .from('role_permissions' as any)
        .delete()
        .eq('role_id', roleId)

    // Insert new permissions
    if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(permId => ({
            role_id: roleId,
            permission_id: permId
        }))

        const { error } = await supabase
            .from('role_permissions' as any)
            .insert(rolePermissions as any)

        if (error) return { error: error.message }
    }

    revalidatePath('/admin/roles')
    return { success: true }
}
