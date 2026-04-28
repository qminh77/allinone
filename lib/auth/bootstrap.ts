import type { SupabaseClient } from '@supabase/supabase-js'

function getConfiguredAdminEmails() {
    return (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
}

async function adminProfileExists(adminClient: SupabaseClient) {
    const { count, error } = await adminClient
        .from('user_profiles')
        .select('id, roles!inner(name)', { count: 'exact', head: true })
        .eq('roles.name', 'Admin')

    if (error) {
        console.error('Failed to check admin profiles:', error)
        return true
    }

    return (count || 0) > 0
}

export async function resolveBootstrapRoleId(adminClient: SupabaseClient, email?: string | null) {
    const normalizedEmail = email?.trim().toLowerCase() || ''
    const configuredAdmins = getConfiguredAdminEmails()
    const shouldBeAdmin = configuredAdmins.includes(normalizedEmail) || !(await adminProfileExists(adminClient))
    const roleName = shouldBeAdmin ? 'Admin' : 'User'

    const { data: role, error } = await adminClient
        .from('roles')
        .select('id, name')
        .eq('name', roleName)
        .maybeSingle()

    if (error) {
        console.error(`Failed to load ${roleName} role:`, error)
    }

    if (role?.id) {
        return { roleId: role.id as string, roleName }
    }

    const { data: fallbackRole } = await adminClient
        .from('roles')
        .select('id, name')
        .eq('name', 'User')
        .maybeSingle()

    return {
        roleId: fallbackRole?.id as string | undefined,
        roleName: fallbackRole?.name || 'User',
    }
}
