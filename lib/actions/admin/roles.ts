'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/authorization-middleware'
import { sanitizeInput } from '@/lib/validation'
import { createAuditLog } from '@/lib/audit/log'
import { z } from 'zod'

const UuidSchema = z.string().uuid()
const RoleNameSchema = z.string().trim().min(2, 'Role name is required').max(60, 'Role name is too long')
const RoleDescriptionSchema = z.string().trim().max(300, 'Description is too long').optional()

function parseRoleForm(formData: FormData) {
    const nameResult = RoleNameSchema.safeParse(String(formData.get('name') || ''))
    const descriptionResult = RoleDescriptionSchema.safeParse(String(formData.get('description') || ''))

    if (!nameResult.success) {
        return { error: nameResult.error.issues[0].message }
    }

    if (!descriptionResult.success) {
        return { error: descriptionResult.error.issues[0].message }
    }

    return {
        value: {
            name: sanitizeInput(nameResult.data, 60),
            description: descriptionResult.data ? sanitizeInput(descriptionResult.data, 300) : null,
        },
    }
}

function validateUuid(id: string, label = 'id') {
    const result = UuidSchema.safeParse(id)
    if (!result.success) {
        return { error: `Invalid ${label}` }
    }

    return { value: result.data }
}

function normalizePermissionIds(permissionIds: string[]) {
    const uniquePermissionIds = Array.from(new Set(permissionIds))
    const invalid = uniquePermissionIds.find((permissionId) => !UuidSchema.safeParse(permissionId).success)

    if (invalid) {
        return { error: 'Invalid permission id' }
    }

    return { value: uniquePermissionIds }
}

async function writeAuditLog(params: Parameters<typeof createAuditLog>[0]) {
    await createAuditLog(params)
}

export async function getRoles() {
    await requireAdmin()
    const supabase = await createClient()
    const db = supabase as any

    const { data: roles, error } = await db
        .from('roles')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name')

    if (error) {
        console.error('Error fetching roles:', error)
        return []
    }

    const [{ data: rolePermissions }, { data: userProfiles }] = await Promise.all([
        db.from('role_permissions').select('role_id, permission_id'),
        db.from('user_profiles').select('role_id'),
    ])

    const permissionCounts = new Map<string, number>()
    rolePermissions?.forEach((row: any) => {
        permissionCounts.set(row.role_id, (permissionCounts.get(row.role_id) || 0) + 1)
    })

    const userCounts = new Map<string, number>()
    userProfiles?.forEach((row: any) => {
        if (row.role_id) {
            userCounts.set(row.role_id, (userCounts.get(row.role_id) || 0) + 1)
        }
    })

    return roles.map((role: any) => ({
        ...role,
        permissionIds: rolePermissions
            ?.filter((row: any) => row.role_id === role.id)
            .map((row: any) => row.permission_id) || [],
        permissionCount: permissionCounts.get(role.id) || 0,
        userCount: userCounts.get(role.id) || 0,
    }))
}

export async function getRole(id: string) {
    await requireAdmin()
    const uuid = validateUuid(id, 'role id')
    if (uuid.error) return null

    const supabase = await createClient()
    const db = supabase as any

    const { data } = await db
        .from('roles')
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
        .eq('id', uuid.value!)
        .single()

    return data
}

export async function createRole(formData: FormData) {
    const currentUser = await requireAdmin()
    const parsed = parseRoleForm(formData)
    if (parsed.error) return { error: parsed.error }

    const supabase = await createClient()
    const db = supabase as any
    const { data, error } = await db
        .from('roles')
        .insert({
            name: parsed.value!.name,
            description: parsed.value!.description,
            is_system: false,
        })
        .select()
        .single()

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'role.create',
        resourceType: 'role',
        resourceId: data.id,
        metadata: { name: data.name },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/roles')
    return { success: true, role: data }
}

export async function updateRole(id: string, formData: FormData) {
    const currentUser = await requireAdmin()
    const uuid = validateUuid(id, 'role id')
    if (uuid.error) return { error: uuid.error }

    const parsed = parseRoleForm(formData)
    if (parsed.error) return { error: parsed.error }

    const supabase = await createClient()
    const db = supabase as any
    const { data: currentRole, error: currentRoleError } = await db
        .from('roles')
        .select('id, name, is_system')
        .eq('id', uuid.value!)
        .single()

    if (currentRoleError || !currentRole) {
        return { error: 'Role not found' }
    }

    if (currentRole.is_system && currentRole.name !== parsed.value!.name) {
        return { error: 'System roles cannot be renamed' }
    }

    const { error } = await db
        .from('roles')
        .update({
            name: parsed.value!.name,
            description: parsed.value!.description,
            updated_at: new Date().toISOString(),
        })
        .eq('id', uuid.value!)

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'role.update',
        resourceType: 'role',
        resourceId: uuid.value,
        metadata: { name: parsed.value!.name },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/roles')
    return { success: true }
}

export async function deleteRole(id: string) {
    const currentUser = await requireAdmin()
    const uuid = validateUuid(id, 'role id')
    if (uuid.error) return { error: uuid.error }

    const supabase = await createClient()
    const db = supabase as any

    const { data: role } = await db
        .from('roles')
        .select('id, name, is_system')
        .eq('id', uuid.value!)
        .single()

    if (!role) return { error: 'Role not found' }

    if (role.is_system || role.name === 'Admin' || role.name === 'User') {
        return { error: 'Cannot delete system roles' }
    }

    const { count } = await db
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role_id', uuid.value!)

    if ((count || 0) > 0) {
        return { error: 'Cannot delete role with active users' }
    }

    const { error } = await db
        .from('roles')
        .delete()
        .eq('id', uuid.value!)

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'role.delete',
        resourceType: 'role',
        resourceId: uuid.value,
        metadata: { name: role.name },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/roles')
    return { success: true }
}

export async function getRolePermissions(roleId: string) {
    await requireAdmin()
    const uuid = validateUuid(roleId, 'role id')
    if (uuid.error) return []

    const supabase = await createClient()
    const db = supabase as any

    const { data } = await db
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', uuid.value!)

    return (data || []).map((rp: any) => rp.permission_id)
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
    const currentUser = await requireAdmin()
    const roleUuid = validateUuid(roleId, 'role id')
    if (roleUuid.error) return { error: roleUuid.error }

    const normalized = normalizePermissionIds(permissionIds)
    if (normalized.error) return { error: normalized.error }

    const supabase = await createClient()
    const db = supabase as any
    const { data: role } = await db
        .from('roles')
        .select('id, name')
        .eq('id', roleUuid.value!)
        .single()

    if (!role) {
        return { error: 'Role not found' }
    }

    if (normalized.value!.length > 0) {
        const { count } = await db
            .from('permissions')
            .select('id', { count: 'exact', head: true })
            .in('id', normalized.value!)

        if ((count || 0) !== normalized.value!.length) {
            return { error: 'One or more permissions do not exist' }
        }
    }

    const { error: deleteError } = await db
        .from('role_permissions')
        .delete()
        .eq('role_id', roleUuid.value!)

    if (deleteError) return { error: deleteError.message }

    if (normalized.value!.length > 0) {
        const rolePermissions = normalized.value!.map((permissionId) => ({
            role_id: roleUuid.value!,
            permission_id: permissionId,
        }))

        const { error } = await db
            .from('role_permissions')
            .insert(rolePermissions)

        if (error) return { error: error.message }
    }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'role.assign_permissions',
        resourceType: 'role',
        resourceId: roleUuid.value,
        metadata: { role: role.name, permission_count: normalized.value!.length },
    })

    revalidatePath('/admin/roles')
    return { success: true }
}
