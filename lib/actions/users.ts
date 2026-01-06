'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

const UserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    roleId: z.string().uuid(),
    isActive: z.boolean().default(true),
})

const UpdateUserSchema = z.object({
    id: z.string().uuid(),
    fullName: z.string().min(2).optional(),
    roleId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
})

export async function createUser(data: z.infer<typeof UserSchema>) {
    const supabase = await createClient()

    // 1. Check permission (must be Admin)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Unauthorized' }

    // Note: We need a Service Role client to create users in Auth
    // Since we don't have it exposed in 'server.ts' easily without env var,
    // we might need to use a separate function or direct Admin API call if allowed.
    // For now, let's assume we can't create Auth users easily without Service Key on client side
    // BUT, Supabase usually requires Service Key for Admin Auth ops.
    // Let's check permissions or use a workaround if needed.
    // Ideally, we should use `supabase-admin` client.

    // TEMPORARY: Return error if we can't strictly do it, or try to insert into profiles and wait for trigger?
    // No, standard way is:

    return { error: 'Creating users requires Service Role access. Feature pending implementation of Admin Client.' }
}

export async function updateUser(data: z.infer<typeof UpdateUserSchema>) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    // 1. Update Profile
    const updates: any = {
        updated_at: new Date().toISOString(),
    }
    if (data.fullName) updates.full_name = data.fullName
    if (data.isActive !== undefined) updates.is_active = data.isActive
    if (data.roleId) updates.role_id = data.roleId

    const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', data.id)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    // We can soft delete or deactivate
    const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}
