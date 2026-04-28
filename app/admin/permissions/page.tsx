import { PermissionManagement } from '@/components/admin/permissions/PermissionManagement'
import { StatsCard } from '@/components/admin/StatsCard'
import { getPermissions } from '@/lib/actions/admin/permissions'
import { Folder, Key, Link2, Shield } from 'lucide-react'

interface PermissionRow {
    id: string
    key: string
    name: string
    module: string | null
    description: string | null
    roleCount?: number
}

export default async function AdminPermissionsPage() {
    const permissions = (await getPermissions()) as PermissionRow[]
    const modules = new Set(permissions.map((permission) => permission.module || 'other'))
    const assignedCount = permissions.filter((permission) => (permission.roleCount || 0) > 0).length
    const totalAssignments = permissions.reduce((sum, permission) => sum + (permission.roleCount || 0), 0)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Quản lý quyền hạn</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    CRUD permission key, phân nhóm theo module và kiểm tra mức độ đang được role sử dụng.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Permissions" value={permissions.length} description="Tổng quyền trong hệ thống" icon={Key} />
                <StatsCard title="Modules" value={modules.size} description="Nhóm permission" icon={Folder} />
                <StatsCard title="Đang dùng" value={assignedCount} description="Được gán ít nhất một role" icon={Shield} />
                <StatsCard title="Lượt gán" value={totalAssignments} description="Tổng role-permission" icon={Link2} />
            </div>

            <PermissionManagement permissions={permissions} />
        </div>
    )
}
