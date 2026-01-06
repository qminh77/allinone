import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUsers } from '@/lib/actions/admin/users'
import { UserManagement } from '@/components/admin/users/UserManagement'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Users } from 'lucide-react'

export default async function UsersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile with role
    const { data: profile } = await supabase
        .from('user_profiles' as any)
        .select('*, roles(name)')
        .eq('id', user.id)
        .single()

    // Check if user is admin
    if ((profile as any)?.roles?.name !== 'Admin') {
        redirect('/dashboard')
    }

    // Fetch all users and roles
    const users = await getUsers()
    const { data: roles } = await supabase
        .from('roles' as any)
        .select('id, name')
        .order('name')

    return (
        <ToolShell
            title="Quản lý người dùng"
            description="Thêm, sửa, xóa người dùng và quản lý quyền truy cập"
            icon={Users}
        >
            <UserManagement users={users} roles={roles || []} />
        </ToolShell>
    )
}
