'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/authorization-middleware'
import { sanitizeInput } from '@/lib/validation'
import { createAuditLog } from '@/lib/audit/log'
import { createAdminDataClient } from '@/lib/admin/db'
import type { Database } from '@/types/database'
import { z } from 'zod'

const UuidSchema = z.string().uuid()
const PermissionKeySchema = z.string()
    .trim()
    .min(3, 'Permission key is required')
    .max(120, 'Permission key is too long')
    .regex(/^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/, 'Permission key can only contain lowercase letters, numbers, dot, underscore, colon and hyphen')
const PermissionNameSchema = z.string().trim().min(2, 'Permission name is required').max(120, 'Permission name is too long')
const ModuleSchema = z.string().trim().max(80, 'Module name is too long').optional()
const DescriptionSchema = z.string().trim().max(300, 'Description is too long').optional()
type PermissionRow = Database['public']['Tables']['permissions']['Row']
type RolePermissionRow = Database['public']['Tables']['role_permissions']['Row']

function validateUuid(id: string, label = 'id') {
    const result = UuidSchema.safeParse(id)
    if (!result.success) {
        return { error: `Invalid ${label}` }
    }

    return { value: result.data }
}

function parsePermissionForm(formData: FormData) {
    const keyResult = PermissionKeySchema.safeParse(String(formData.get('key') || ''))
    const nameResult = PermissionNameSchema.safeParse(String(formData.get('name') || ''))
    const moduleResult = ModuleSchema.safeParse(String(formData.get('module') || ''))
    const descriptionResult = DescriptionSchema.safeParse(String(formData.get('description') || ''))

    if (!keyResult.success) return { error: keyResult.error.issues[0].message }
    if (!nameResult.success) return { error: nameResult.error.issues[0].message }
    if (!moduleResult.success) return { error: moduleResult.error.issues[0].message }
    if (!descriptionResult.success) return { error: descriptionResult.error.issues[0].message }

    return {
        value: {
            key: keyResult.data,
            name: sanitizeInput(nameResult.data, 120),
            module: moduleResult.data ? sanitizeInput(moduleResult.data, 80) : null,
            description: descriptionResult.data ? sanitizeInput(descriptionResult.data, 300) : null,
        },
    }
}

async function writeAuditLog(params: Parameters<typeof createAuditLog>[0]) {
    await createAuditLog(params)
}

export async function getPermissions() {
    await requireAdmin()
    const supabase = await createAdminDataClient()
    const db = supabase

    const { data: permissions, error } = await db
        .from('permissions')
        .select('*')
        .order('module')
        .order('key')

    if (error) {
        console.error('Error fetching permissions:', error)
        return []
    }

    const { data: rolePermissions } = await db
        .from('role_permissions')
        .select('permission_id')

    const roleCounts = new Map<string, number>()
    const rolePermissionRows = (rolePermissions ?? []) as Array<Pick<RolePermissionRow, 'permission_id'>>
    rolePermissionRows.forEach((row) => {
        roleCounts.set(row.permission_id, (roleCounts.get(row.permission_id) || 0) + 1)
    })

    return (permissions ?? []).map((permission: PermissionRow) => ({
        ...permission,
        roleCount: roleCounts.get(permission.id) || 0,
    }))
}

export async function getPermission(id: string) {
    await requireAdmin()
    const uuid = validateUuid(id, 'permission id')
    if (uuid.error) return null

    const supabase = await createAdminDataClient()
    const db = supabase

    const { data } = await db
        .from('permissions')
        .select('*')
        .eq('id', uuid.value!)
        .single()

    return data
}

export async function createPermission(formData: FormData) {
    const currentUser = await requireAdmin()
    const parsed = parsePermissionForm(formData)
    if (parsed.error) return { error: parsed.error }

    const supabase = await createAdminDataClient()
    const db = supabase

    const { data: existing } = await db
        .from('permissions')
        .select('id')
        .eq('key', parsed.value!.key)
        .maybeSingle()

    if (existing) {
        return { error: 'Permission key already exists' }
    }

    const { data, error } = await db
        .from('permissions')
        .insert(parsed.value as never)
        .select()
        .single()

    if (error) return { error: error.message }
    const createdPermission = data as PermissionRow | null
    if (!createdPermission) return { error: 'Permission not found' }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'permission.create',
        resourceType: 'permission',
        resourceId: createdPermission.id,
        metadata: { key: createdPermission.key },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/permissions')
    revalidatePath('/admin/roles')
    return { success: true, permission: createdPermission }
}

export async function updatePermission(id: string, formData: FormData) {
    const currentUser = await requireAdmin()
    const uuid = validateUuid(id, 'permission id')
    if (uuid.error) return { error: uuid.error }

    const parsed = parsePermissionForm(formData)
    if (parsed.error) return { error: parsed.error }

    const supabase = await createAdminDataClient()
    const db = supabase
    const { data: existingWithKey } = await db
        .from('permissions')
        .select('id')
        .eq('key', parsed.value!.key)
        .neq('id', uuid.value!)
        .maybeSingle()

    if (existingWithKey) {
        return { error: 'Permission key already exists' }
    }

    const { error } = await db
        .from('permissions')
        .update(parsed.value as never)
        .eq('id', uuid.value!)

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'permission.update',
        resourceType: 'permission',
        resourceId: uuid.value,
        metadata: { key: parsed.value!.key },
    })

    revalidatePath('/admin/permissions')
    revalidatePath('/admin/roles')
    return { success: true }
}

export async function deletePermission(id: string) {
    const currentUser = await requireAdmin()
    const uuid = validateUuid(id, 'permission id')
    if (uuid.error) return { error: uuid.error }

    const supabase = await createAdminDataClient()
    const db = supabase

    const { data: permission } = await db
        .from('permissions')
        .select('id, key')
        .eq('id', uuid.value!)
        .single()

    const existingPermission = permission as PermissionRow | null

    if (!existingPermission) {
        return { error: 'Permission not found' }
    }

    const { count } = await db
        .from('role_permissions')
        .select('role_id', { count: 'exact', head: true })
        .eq('permission_id', uuid.value!)

    if ((count || 0) > 0) {
        return { error: 'Cannot delete permission assigned to roles' }
    }

    const { error } = await db
        .from('permissions')
        .delete()
        .eq('id', uuid.value!)

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'permission.delete',
        resourceType: 'permission',
        resourceId: uuid.value,
        metadata: { key: existingPermission.key },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/permissions')
    revalidatePath('/admin/roles')
    return { success: true }
}
