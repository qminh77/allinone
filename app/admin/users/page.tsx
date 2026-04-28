import { createClient } from '@/lib/supabase/server'
import { getUsers } from '@/lib/actions/admin/users'
import { UserManagement } from '@/components/admin/users/UserManagement'
import { StatsCard } from '@/components/admin/StatsCard'
import { Shield, UserCheck, UserX, Users } from 'lucide-react'

export default async function UsersPage() {
    const supabase = await createClient()
    const [users, rolesResult] = await Promise.all([
        getUsers(),
        supabase
            .from('roles')
            .select('id, name')
            .order('name'),
    ])

    const activeUsers = users.filter((user: any) => user.is_active).length
    const inactiveUsers = users.length - activeUsers
    const adminUsers = users.filter((user: any) => user.roles?.name === 'Admin').length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Quản lý người dùng</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tạo tài khoản, cập nhật role, khóa truy cập, đổi mật khẩu và import CSV.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Tổng người dùng" value={users.length} description="Tất cả tài khoản" icon={Users} />
                <StatsCard title="Đang hoạt động" value={activeUsers} description="Có thể đăng nhập" icon={UserCheck} />
                <StatsCard title="Vô hiệu" value={inactiveUsers} description="Bị khóa truy cập" icon={UserX} />
                <StatsCard title="Admins" value={adminUsers} description="Tài khoản quản trị" icon={Shield} />
            </div>

            <UserManagement users={users} roles={rolesResult.data || []} />
        </div>
    )
}
