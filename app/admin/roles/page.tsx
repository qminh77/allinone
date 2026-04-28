import { RoleManagement } from '@/components/admin/roles/RoleManagement'
import { StatsCard } from '@/components/admin/StatsCard'
import { getPermissions } from '@/lib/actions/admin/permissions'
import { getRoles } from '@/lib/actions/admin/roles'
import { Key, Lock, Shield, Users } from 'lucide-react'

interface RoleRow {
    id: string
    name: string
    description: string | null
    is_system: boolean
    permissionCount: number
    userCount: number
    permissionIds?: string[]
}

export default async function AdminRolesPage() {
    const [roleRows, permissions] = await Promise.all([
        getRoles(),
        getPermissions(),
    ])
    const roles = roleRows as RoleRow[]

    const totalRoles = roles.length
    const systemRoles = roles.filter((role) => role.is_system).length
    const assignedUsers = roles.reduce((sum, role) => sum + role.userCount, 0)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Quản lý vai trò</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    CRUD role, kiểm soát role hệ thống và gán permissions theo module.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Tổng vai trò" value={totalRoles} description="System và custom" icon={Shield} />
                <StatsCard title="System roles" value={systemRoles} description="Không thể xóa" icon={Lock} />
                <StatsCard title="Permissions" value={permissions.length} description="Có thể gán cho role" icon={Key} />
                <StatsCard title="User đã gán" value={assignedUsers} description="Theo vai trò hiện tại" icon={Users} />
            </div>

            <RoleManagement roles={roles} permissions={permissions} />
        </div>
    )
}
