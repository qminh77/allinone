'use server'

import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/authorization-middleware'
import { createAdminDataClient, getActionErrorMessage } from '@/lib/admin/db'
import { EmailSchema, PasswordSchema, sanitizeInput } from '@/lib/validation'
import { randomInt } from 'crypto'
import { z } from 'zod'
import type { Database } from '@/types/database'

const UuidSchema = z.string().uuid()
const NameSchema = z.string().trim().min(2, 'Full name is required').max(120, 'Full name is too long')
const CSV_MAX_ROWS = 200

type RoleRow = Database['public']['Tables']['roles']['Row']
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
type UserWithRole = UserProfileRow & {
    roles?: Pick<RoleRow, 'id' | 'name'> | null
}
type UserWithLogin = UserWithRole & {
    email?: string
    last_ip?: string | null
    last_device?: string | null
    last_login?: string
}
type BulkImportResult = {
    email: string
    fullName?: string
    role?: string
    error?: string
    success?: boolean
    tempPassword?: string
    userId?: string
}

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
    const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .eq('id', roleId)
        .single()

    if (error || !data) return null
    return data as Pick<RoleRow, 'id' | 'name'>
}

async function isLastActiveAdmin(userId: string) {
    const supabase = await createAdminDataClient()
    const { data: adminRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Admin')
        .single()

    const adminRoleRow = adminRole as Pick<RoleRow, 'id'> | null
    if (!adminRoleRow?.id) return false

    const { data: target } = await supabase
        .from('user_profiles')
        .select('role_id, is_active')
        .eq('id', userId)
        .single()

    const targetRow = target as Pick<UserProfileRow, 'role_id' | 'is_active'> | null
    if (!targetRow || targetRow.role_id !== adminRoleRow.id || !targetRow.is_active) {
        return false
    }

    const { count } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role_id', adminRoleRow.id)
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

    // 1. Fetch users
    const { data: users, error } = await supabase
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
    const { data: logs } = await supabase
        .from('audit_logs')
        .select('user_id, ip_address, user_agent, created_at')
        .eq('action', 'login')
        .order('created_at', { ascending: false })
        .limit(1000) // Limit scanning for now

    // Map logs to users
    const userRows = (users || []) as UserWithRole[]
    const loginLogs = (logs || []) as Array<{
        user_id: string | null
        ip_address: string | null
        user_agent: string | null
        created_at: string
    }>

    const usersWithLogs: UserWithLogin[] = userRows.map((user) => {
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

    const { data } = await supabase
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
        const profilePayload: UserProfileInsert = {
            id: authData.user.id,
            full_name: fullName,
            role_id: roleValidation.value,
            is_active: true
        }

        const { error: profileError } = await adminSupabase
            .from('user_profiles')
            .upsert(profilePayload as never, { onConflict: 'id' })

        if (profileError) {
            // Rollback: delete auth user if profile creation fails
            await adminSupabase.auth.admin.deleteUser(authData.user.id)
            return { error: profileError.message }
        }

        revalidatePath('/admin/users')
        return { success: true, tempPassword, userId: authData.user.id }
    } catch (err) {
        return { error: getActionErrorMessage(err, 'Failed to create user') }
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
        const profileUpdate: UserProfileUpdate = {
            full_name: fullName,
            role_id: roleValidation.value,
            is_active: isActive,
            updated_at: new Date().toISOString()
        }

        const { error } = await supabase
            .from('user_profiles')
            .update(profileUpdate as never)
            .eq('id', uuid.value!)

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
    } catch (err) {
        return { error: getActionErrorMessage(err, 'Failed to delete user') }
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
    } catch (err) {
        return { error: getActionErrorMessage(err, 'Failed to update password') }
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

    const results: BulkImportResult[] = []
    const supabase = await createAdminDataClient()

    // Get roles mapping
    const { data: roles } = await supabase
        .from('roles')
        .select('id, name')
    const roleRows = (roles || []) as Array<Pick<RoleRow, 'id' | 'name'>>
    const roleMap = new Map<string, string>(
        roleRows.map((role) => [role.name.toLowerCase(), role.id])
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
