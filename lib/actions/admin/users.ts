'use server'

import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/authorization-middleware'
import { createAdminDataClient, getActionErrorMessage } from '@/lib/admin/db'
import { EmailSchema, PasswordSchema, sanitizeInput } from '@/lib/validation'
import { randomInt } from 'crypto'
import { z } from 'zod'

const UuidSchema = z.string().uuid()
const NameSchema = z.string().trim().min(2, 'Full name is required').max(120, 'Full name is too long')
const CSV_MAX_ROWS = 200

function validateUuid(id: string, label = 'id') {
    const result = UuidSchema.safeParse(id)
    if (!result.success) {
        return { error: `Invalid ${label}` }
    }
    return { value: result.data }
}

function getAdminSupabase() {
    if (!isAdminClientConfigured()) {
        throw new Error('Admin user management requires SUPABASE_SERVICE_ROLE_KEY')
    }

    return createAdminClient()
}

async function getRoleById(roleId: string) {
    const supabase = await createAdminDataClient()
    const db = supabase as any
    const { data, error } = await db
        .from('roles')
        .select('id, name')
        .eq('id', roleId)
        .single()

    if (error || !data) return null
    return data
}

async function isLastActiveAdmin(userId: string) {
    const supabase = await createAdminDataClient()
    const db = supabase as any
    const { data: adminRole } = await db
        .from('roles')
        .select('id')
        .eq('name', 'Admin')
        .single()

    if (!adminRole?.id) return false

    const { data: target } = await db
        .from('user_profiles')
        .select('role_id, is_active')
        .eq('id', userId)
        .single()

    if (!target || target.role_id !== adminRole.id || !target.is_active) {
        return false
    }

    const { count } = await db
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role_id', adminRole.id)
        .eq('is_active', true)

    return (count || 0) <= 1
}

function parseBoolean(value: FormDataEntryValue | null, fallback = false) {
    if (typeof value !== 'string') return fallback
    return value === 'true' || value === 'on'
}

export async function getUsers() {
    await requireAdmin()
    const supabase = await createAdminDataClient()
    const db = supabase as any

    // 1. Fetch users
    const { data: users, error } = await db
        .from('user_profiles')
        .select(`
            *,
            roles (
                id,
                name
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching users:', error)
        return []
    }

    const authEmailById = new Map<string, string>()
    if (isAdminClientConfigured()) {
        try {
            const adminSupabase = createAdminClient()
            const { data: authUsers } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
            authUsers.users.forEach((authUser) => {
                if (authUser.email) {
                    authEmailById.set(authUser.id, authUser.email)
                }
            })
        } catch (authError) {
            console.warn('Unable to fetch auth user emails:', authError)
        }
    }

    // 2. Fetch latest audit log (login) for each user
    // Optimization: Fetch all 'login' logs, ordered by time desc
    // In a real large app, this should be optimized with a specific RPC or better query
    const { data: logs } = await db
        .from('audit_logs')
        .select('user_id, ip_address, user_agent, created_at')
        .eq('action', 'login')
        .order('created_at', { ascending: false })
        .limit(1000) // Limit scanning for now

    // Map logs to users
    const userRows = (users || []) as any[]
    const loginLogs = (logs || []) as Array<{
        user_id: string | null
        ip_address: string | null
        user_agent: string | null
        created_at: string
    }>

    const usersWithLogs = userRows.map((user: any) => {
        const lastLogin = loginLogs.find((log) => log.user_id === user.id)
        return {
            ...user,
            email: authEmailById.get(user.id),
            last_ip: lastLogin?.ip_address,
            last_device: lastLogin?.user_agent,
            last_login: lastLogin?.created_at
        }
    })

    return usersWithLogs
}

export async function getUser(id: string) {
    await requireAdmin()
    const uuid = validateUuid(id, 'user id')
    if (uuid.error) return null

    const supabase = await createAdminDataClient()
    const db = supabase as any

    const { data } = await db
        .from('user_profiles')
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
    await requireAdmin()

    const email = String(formData.get('email') || '').trim().toLowerCase()
    const fullNameInput = String(formData.get('full_name') || '')
    const roleId = String(formData.get('role_id') || '')
    const nameValidation = NameSchema.safeParse(fullNameInput)
    const roleValidation = validateUuid(roleId, 'role id')

    if (!nameValidation.success) {
        return { error: nameValidation.error.issues[0].message }
    }

    if (roleValidation.error) {
        return { error: roleValidation.error }
    }

    const fullName = sanitizeInput(nameValidation.data, 120)
    const role = await getRoleById(roleValidation.value!)
    if (!role) {
        return { error: 'Role not found' }
    }

    const emailValidation = EmailSchema.safeParse(email)
    if (!emailValidation.success) {
        return { error: `Invalid email: ${emailValidation.error.issues[0].message}` }
    }

    // Generate temporary password
    const tempPassword = generatePassword()

    try {
        // Create auth user using admin client
        const adminSupabase = getAdminSupabase()
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: emailValidation.data,
            password: tempPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName
            }
        })

        if (authError) return { error: authError.message }

        // Create user profile
        const { error: profileError } = await (adminSupabase
            .from('user_profiles' as any) as any)
            .upsert({
                id: authData.user.id,
                full_name: fullName,
                role_id: roleValidation.value,
                is_active: true
            } as any, { onConflict: 'id' })

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
    const currentUser = await requireAdmin()
    const uuid = validateUuid(id, 'user id')
    if (uuid.error) return { error: uuid.error }

    const fullNameInput = String(formData.get('full_name') || '')
    const roleId = String(formData.get('role_id') || '')
    const isActive = parseBoolean(formData.get('is_active'), false)
    const nameValidation = NameSchema.safeParse(fullNameInput)
    const roleValidation = validateUuid(roleId, 'role id')

    if (!nameValidation.success) {
        return { error: nameValidation.error.issues[0].message }
    }

    if (roleValidation.error) {
        return { error: roleValidation.error }
    }

    const fullName = sanitizeInput(nameValidation.data, 120)
    const nextRole = await getRoleById(roleValidation.value!)
    if (!nextRole) {
        return { error: 'Role not found' }
    }

    if (currentUser.id === uuid.value && (!isActive || nextRole.name !== 'Admin')) {
        return { error: 'You cannot deactivate or demote your own admin account' }
    }

    const wouldRemoveLastAdmin = await isLastActiveAdmin(uuid.value!)
    if (wouldRemoveLastAdmin && (!isActive || nextRole.name !== 'Admin')) {
        return { error: 'Cannot remove the last active admin account' }
    }

    try {
        const supabase = await createAdminDataClient()
        const { error } = await (supabase
            .from('user_profiles' as any) as any)
            .update({
                full_name: fullName,
                role_id: roleValidation.value,
                is_active: isActive,
                updated_at: new Date().toISOString()
            } as any)
            .eq('id', uuid.value)

        if (error) return { error: error.message }

        revalidatePath('/admin/users')
        return { success: true }
    } catch (err) {
        return { error: getActionErrorMessage(err, 'Failed to update user') }
    }
}

export async function deleteUser(id: string) {
    const currentUser = await requireAdmin()
    const uuid = validateUuid(id, 'user id')
    if (uuid.error) return { error: uuid.error }

    if (currentUser.id === uuid.value) {
        return { error: 'You cannot delete your own admin account' }
    }

    if (await isLastActiveAdmin(uuid.value!)) {
        return { error: 'Cannot delete the last active admin account' }
    }

    try {
        const adminSupabase = getAdminSupabase()

        // Delete auth user (this will cascade delete profile due to FK)
        const { error } = await adminSupabase.auth.admin.deleteUser(uuid.value!)

        if (error) return { error: error.message }

        revalidatePath('/admin/users')
        return { success: true }
    } catch (err: any) {
        return { error: err.message || 'Failed to delete user' }
    }
}

export async function resetPassword(userId: string) {
    await requireAdmin()
    const uuid = validateUuid(userId, 'user id')
    if (uuid.error) return { error: uuid.error }

    const newPassword = generatePassword()
    return updateUserPassword(uuid.value!, newPassword)
}

export async function updateUserPassword(userId: string, password: string) {
    await requireAdmin()
    const uuid = validateUuid(userId, 'user id')
    if (uuid.error) return { error: uuid.error }

    const passwordValidation = PasswordSchema.safeParse(password)
    if (!passwordValidation.success) {
        return { error: passwordValidation.error.issues[0].message }
    }

    try {
        const adminSupabase = getAdminSupabase()
        const { error } = await adminSupabase.auth.admin.updateUserById(uuid.value!, {
            password: passwordValidation.data
        })

        if (error) return { error: error.message }

        return { success: true, newPassword: passwordValidation.data }
    } catch (err: any) {
        return { error: err.message || 'Failed to update password' }
    }
}

export async function bulkImportUsers(csvText: string) {
    await requireAdmin()

    const lines = csvText
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)

    if (lines.length < 2) {
        return { error: 'CSV file is empty or invalid' }
    }

    if (lines.length - 1 > CSV_MAX_ROWS) {
        return { error: `CSV import is limited to ${CSV_MAX_ROWS} users per batch` }
    }

    // Parse header
    const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase())
    const emailIndex = headers.indexOf('email')
    const nameIndex = headers.indexOf('full_name')
    const roleIndex = headers.indexOf('role')

    if (emailIndex === -1 || nameIndex === -1 || roleIndex === -1) {
        return { error: 'CSV must have columns: email, full_name, role' }
    }

    const results: any[] = []
    const supabase = await createAdminDataClient()
    const db = supabase as any

    // Get roles mapping
    const { data: roles } = await db
        .from('roles')
        .select('id, name')
    const roleMap = new Map<string, string>(
        (roles || []).map((r: any) => [String(r.name).toLowerCase(), String(r.id)])
    )

    // Process each row
    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]).map(v => v.trim())
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
        password += charset.charAt(randomInt(0, charset.length))
    }
    return password
}

function parseCsvLine(line: string) {
    const cells: string[] = []
    let current = ''
    let quoted = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const next = line[i + 1]

        if (char === '"' && quoted && next === '"') {
            current += '"'
            i += 1
            continue
        }

        if (char === '"') {
            quoted = !quoted
            continue
        }

        if (char === ',' && !quoted) {
            cells.push(current)
            current = ''
            continue
        }

        current += char
    }

    cells.push(current)
    return cells
}
