'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/authorization-middleware'
import { sanitizeInput } from '@/lib/validation'
import { createAuditLog } from '@/lib/audit/log'
import { createAdminDataClient, getActionErrorMessage } from '@/lib/admin/db'
import { z } from 'zod'
import type { Database } from '@/types/database'

const UuidSchema = z.string().uuid()
const RoleNameSchema = z.string().trim().min(2, 'Role name is required').max(60, 'Role name is too long')
const RoleDescriptionSchema = z.string().trim().max(300, 'Description is too long').optional()

type RoleRow = Database['public']['Tables']['roles']['Row']
type RoleInsert = Database['public']['Tables']['roles']['Insert']
type RoleUpdate = Database['public']['Tables']['roles']['Update']
type RolePermissionRow = Database['public']['Tables']['role_permissions']['Row']
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']

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
    const supabase = await createAdminDataClient()

    const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name')

    if (error) {
        console.error('Error fetching roles:', error)
        return []
    }

    const [{ data: rolePermissions }, { data: userProfiles }] = await Promise.all([
        supabase.from('role_permissions').select('role_id, permission_id'),
        supabase.from('user_profiles').select('role_id'),
    ])
    const roleRows = (roles ?? []) as RoleRow[]
    const permissionRows = (rolePermissions ?? []) as Array<Pick<RolePermissionRow, 'role_id' | 'permission_id'>>
    const userRows = (userProfiles ?? []) as Array<Pick<UserProfileRow, 'role_id'>>

    const permissionCounts = new Map<string, number>()
    permissionRows.forEach((row) => {
        permissionCounts.set(row.role_id, (permissionCounts.get(row.role_id) || 0) + 1)
    })

    const userCounts = new Map<string, number>()
    userRows.forEach((row) => {
        if (row.role_id) {
            userCounts.set(row.role_id, (userCounts.get(row.role_id) || 0) + 1)
        }
    })

    return roleRows.map((role) => ({
        ...role,
        permissionIds: permissionRows
            ?.filter((row) => row.role_id === role.id)
            .map((row) => row.permission_id) || [],
        permissionCount: permissionCounts.get(role.id) || 0,
        userCount: userCounts.get(role.id) || 0,
    }))
}

export async function getRole(id: string) {
    await requireAdmin()
    const uuid = validateUuid(id, 'role id')
    if (uuid.error) return null

    const supabase = await createAdminDataClient()

    const { data } = await supabase
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
    try {
        const currentUser = await requireAdmin()
        const parsed = parseRoleForm(formData)
        if (parsed.error) return { error: parsed.error }

        const supabase = await createAdminDataClient()
        const payload: RoleInsert = {
            name: parsed.value!.name,
            description: parsed.value!.description,
            is_system: false,
        }
        const { data, error } = await supabase
            .from('roles')
            .insert(payload as never)
            .select()
            .single()

        if (error) return { error: error.message }
        const createdRole = data as RoleRow | null
        if (!createdRole) return { error: 'Role not found' }

        await writeAuditLog({
            userId: currentUser.id,
            action: 'role.create',
            resourceType: 'role',
            resourceId: createdRole.id,
            metadata: { name: createdRole.name },
        })

        revalidatePath('/admin')
        revalidatePath('/admin/roles')
        return { success: true, role: createdRole }
    } catch (error) {
        return { error: getActionErrorMessage(error, 'Failed to create role') }
    }
}

export async function updateRole(id: string, formData: FormData) {
    const currentUser = await requireAdmin()
    const uuid = validateUuid(id, 'role id')
    if (uuid.error) return { error: uuid.error }

    const parsed = parseRoleForm(formData)
    if (parsed.error) return { error: parsed.error }

    const supabase = await createAdminDataClient()
    const payload: RoleUpdate = {
        name: parsed.value!.name,
        description: parsed.value!.description,
        updated_at: new Date().toISOString(),
    }
    const { data: currentRole, error: currentRoleError } = await supabase
        .from('roles')
        .select('id, name, is_system')
        .eq('id', uuid.value!)
        .single()

    if (currentRoleError || !currentRole) {
        return { error: 'Role not found' }
    }
    const currentRoleRow = currentRole as Pick<RoleRow, 'id' | 'name' | 'is_system'>

    if (currentRoleRow.is_system && currentRoleRow.name !== parsed.value!.name) {
        return { error: 'System roles cannot be renamed' }
    }

    const { error } = await supabase
        .from('roles')
        .update(payload as never)
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

    const supabase = await createAdminDataClient()

    const { data: role } = await supabase
        .from('roles')
        .select('id, name, is_system')
        .eq('id', uuid.value!)
        .single()

    if (!role) return { error: 'Role not found' }
    const roleRow = role as Pick<RoleRow, 'id' | 'name' | 'is_system'>

    if (roleRow.is_system || roleRow.name === 'Admin' || roleRow.name === 'User') {
        return { error: 'Cannot delete system roles' }
    }

    const { count } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role_id', uuid.value!)

    if ((count || 0) > 0) {
        return { error: 'Cannot delete role with active users' }
    }

    const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', uuid.value!)

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'role.delete',
        resourceType: 'role',
        resourceId: uuid.value,
        metadata: { name: roleRow.name },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/roles')
    return { success: true }
}

export async function getRolePermissions(roleId: string) {
    await requireAdmin()
    const uuid = validateUuid(roleId, 'role id')
    if (uuid.error) return []

    const supabase = await createAdminDataClient()

    const { data } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', uuid.value!)

    const rows = (data || []) as Array<Pick<RolePermissionRow, 'permission_id'>>
    return rows.map((rp) => rp.permission_id)
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
    const currentUser = await requireAdmin()
    const roleUuid = validateUuid(roleId, 'role id')
    if (roleUuid.error) return { error: roleUuid.error }

    const normalized = normalizePermissionIds(permissionIds)
    if (normalized.error) return { error: normalized.error }

    const supabase = await createAdminDataClient()
    const { data: role } = await supabase
        .from('roles')
        .select('id, name')
        .eq('id', roleUuid.value!)
        .single()

    if (!role) {
        return { error: 'Role not found' }
    }
    const roleRow = role as Pick<RoleRow, 'id' | 'name'>

    if (normalized.value!.length > 0) {
        const { count } = await supabase
            .from('permissions')
            .select('id', { count: 'exact', head: true })
            .in('id', normalized.value!)

        if ((count || 0) !== normalized.value!.length) {
            return { error: 'One or more permissions do not exist' }
        }
    }

    const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleUuid.value!)

    if (deleteError) return { error: deleteError.message }

    if (normalized.value!.length > 0) {
        const rolePermissions = normalized.value!.map((permissionId) => ({
            role_id: roleUuid.value!,
            permission_id: permissionId,
        }))

        const { error } = await supabase
            .from('role_permissions')
            .insert(rolePermissions as never)

        if (error) return { error: error.message }
    }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'role.assign_permissions',
        resourceType: 'role',
        resourceId: roleUuid.value,
        metadata: { role: roleRow.name, permission_count: normalized.value!.length },
    })

    revalidatePath('/admin/roles')
    return { success: true }
}
