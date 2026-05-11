'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type CreateUserInput = {
    email: string
    password: string
    fullName: string
    roleId: string
    isActive: boolean
}

type UpdateUserInput = {
    id: string
    fullName?: string
    roleId?: string
    isActive?: boolean
}

export async function createUser(data: CreateUserInput) {
    const supabase = await createClient()
    void data

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Unauthorized' }

    return { error: 'Creating users requires Service Role access. Feature pending implementation of Admin Client.' }
}

export async function updateUser(data: UpdateUserInput) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    const updates: Database['public']['Tables']['user_profiles']['Update'] = {
        updated_at: new Date().toISOString(),
    }

    if (data.fullName) updates.full_name = data.fullName
    if (data.isActive !== undefined) updates.is_active = data.isActive
    if (data.roleId) updates.role_id = data.roleId

    const { error } = await supabase
        .from('user_profiles')
        .update(updates as never)
        .eq('id', data.id)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false } as never)
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}
