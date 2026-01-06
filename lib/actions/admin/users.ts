'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Admin client for user management (needs service role key)
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createAdminClient(supabaseUrl, supabaseServiceKey)
}

export async function getUsers() {
    const supabase = await createClient()

    const { data } = await supabase
        .from('user_profiles' as any)
        .select(`
            *,
            roles (
                id,
                name
            )
        `)
        .order('created_at', { ascending: false })

    return data || []
}

export async function getUser(id: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('user_profiles' as any)
        .select(`
            *,
            roles (
                id,
                name
            )
        `)
        .eq('id', id)
        .single()

    return data
}

export async function createUser(formData: FormData) {
    const email = formData.get('email') as string
    const fullName = formData.get('full_name') as string
    const roleId = formData.get('role_id') as string

    if (!email || !fullName || !roleId) {
        return { error: 'Missing required fields' }
    }

    // Generate temporary password
    const tempPassword = generatePassword()

    try {
        // Create auth user using admin client
        const adminSupabase = getAdminClient()
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName
            }
        })

        if (authError) return { error: authError.message }

        // Create user profile
        const supabase = await createClient()
        const { error: profileError } = await supabase
            .from('user_profiles' as any)
            .insert({
                id: authData.user.id,
                full_name: fullName,
                role_id: roleId,
                is_active: true
            } as any)

        if (profileError) {
            // Rollback: delete auth user if profile creation fails
            await adminSupabase.auth.admin.deleteUser(authData.user.id)
            return { error: profileError.message }
        }

        revalidatePath('/admin/users')
        return { success: true, tempPassword, userId: authData.user.id }
    } catch (err: any) {
        return { error: err.message || 'Failed to create user' }
    }
}

export async function updateUser(id: string, formData: FormData) {
    const fullName = formData.get('full_name') as string
    const roleId = formData.get('role_id') as string
    const isActive = formData.get('is_active') === 'true'

    const supabase = await createClient()
    const { error } = await supabase
        .from('user_profiles' as any)
        .update({
            full_name: fullName,
            role_id: roleId,
            is_active: isActive,
            updated_at: new Date().toISOString()
        } as any)
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function deleteUser(id: string) {
    try {
        const adminSupabase = getAdminClient()

        // Delete auth user (this will cascade delete profile due to FK)
        const { error } = await adminSupabase.auth.admin.deleteUser(id)

        if (error) return { error: error.message }

        revalidatePath('/admin/users')
        return { success: true }
    } catch (err: any) {
        return { error: err.message || 'Failed to delete user' }
    }
}

export async function resetPassword(userId: string) {
    const newPassword = generatePassword()

    try {
        const adminSupabase = getAdminClient()
        const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
            password: newPassword
        })

        if (error) return { error: error.message }

        return { success: true, newPassword }
    } catch (err: any) {
        return { error: err.message || 'Failed to reset password' }
    }
}

export async function bulkImportUsers(csvText: string) {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) {
        return { error: 'CSV file is empty or invalid' }
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const emailIndex = headers.indexOf('email')
    const nameIndex = headers.indexOf('full_name')
    const roleIndex = headers.indexOf('role')

    if (emailIndex === -1 || nameIndex === -1 || roleIndex === -1) {
        return { error: 'CSV must have columns: email, full_name, role' }
    }

    const results: any[] = []
    const supabase = await createClient()

    // Get roles mapping
    const { data: roles } = await supabase
        .from('roles' as any)
        .select('id, name')
    const roleMap = new Map((roles || []).map((r: any) => [r.name.toLowerCase(), r.id]))

    // Process each row
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const email = values[emailIndex]
        const fullName = values[nameIndex]
        const roleName = values[roleIndex]

        const roleId = roleMap.get(roleName.toLowerCase())
        if (!roleId) {
            results.push({ email, error: `Role '${roleName}' not found` })
            continue
        }

        const formData = new FormData()
        formData.append('email', email)
        formData.append('full_name', fullName)
        formData.append('role_id', roleId)

        const result = await createUser(formData)
        results.push({
            email,
            fullName,
            role: roleName,
            ...result
        })
    }

    revalidatePath('/admin/users')
    return { success: true, results }
}

// Helper function to generate random password
function generatePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
}
