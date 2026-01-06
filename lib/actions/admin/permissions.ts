'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPermissions() {
    const supabase = await createClient()

    const { data } = await supabase
        .from('permissions' as any)
        .select('*')
        .order('module')
        .order('name')

    return data || []
}

export async function getPermission(id: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('permissions' as any)
        .select('*')
        .eq('id', id)
        .single()

    return data
}

export async function createPermission(formData: FormData) {
    const key = formData.get('key') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const module = formData.get('module') as string

    if (!key || !name) {
        return { error: 'Permission key and name are required' }
    }

    const supabase = await createClient()

    // Check if key already exists
    const { data: existing } = await supabase
        .from('permissions' as any)
        .select('id')
        .eq('key', key)
        .single()

    if (existing) {
        return { error: 'Permission key already exists' }
    }

    const { error } = await supabase
        .from('permissions' as any)
        .insert({
            key,
            name,
            description: description || null,
            module: module || null
        } as any)

    if (error) return { error: error.message }

    revalidatePath('/admin/permissions')
    return { success: true }
}

export async function updatePermission(id: string, formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const module = formData.get('module') as string

    const supabase = await createClient()
    const { error } = await supabase
        .from('permissions' as any)
        .update({
            name,
            description: description || null,
            module: module || null
        } as any)
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/permissions')
    return { success: true }
}

export async function deletePermission(id: string) {
    const supabase = await createClient()

    // Check if permission is in use
    const { data: rolePerms } = await supabase
        .from('role_permissions' as any)
        .select('id')
        .eq('permission_id', id)
        .limit(1)

    if (rolePerms && rolePerms.length > 0) {
        return { error: 'Cannot delete permission assigned to roles' }
    }

    const { error } = await supabase
        .from('permissions' as any)
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/permissions')
    return { success: true }
}
