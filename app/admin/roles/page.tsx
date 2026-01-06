/**
 * Admin Roles Page
 * Role management with CRUD operations
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RoleCard } from '@/components/admin/RoleCard'
import { StatsCard } from '@/components/admin/StatsCard'
import { Shield, Users, Lock } from 'lucide-react'

export default async function AdminRolesPage() {
    const supabase = await createClient()

    // Fetch roles with permission and user counts
    const { data: roles } = await supabase
        .from('roles')
        .select(`
            *,
            role_permissions(count),
            user_profiles(count)
        `)
        .order('is_system', { ascending: false })
        .order('created_at', { ascending: false })

    // Calculate stats
    const totalRoles = roles?.length || 0
    const systemRoles = roles?.filter(r => r.is_system).length || 0
    const customRoles = totalRoles - systemRoles

    // Process roles with counts
    const processedRoles = roles?.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        is_system: role.is_system,
        // @ts-ignore
        permissionCount: role.role_permissions?.[0]?.count || 0,
        // @ts-ignore
        userCount: role.user_profiles?.[0]?.count || 0,
    })) || []

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Total Roles"
                    value={totalRoles}
                    description="All roles in system"
                    icon={Shield}
                />
                <StatsCard
                    title="System Roles"
                    value={systemRoles}
                    description="Protected system roles"
                    icon={Lock}
                />
                <StatsCard
                    title="Custom Roles"
                    value={customRoles}
                    description="User-created roles"
                    icon={Users}
                />
            </div>

            {/* Roles Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Các Role trong hệ thống</CardTitle>
                    <CardDescription>
                        Quản lý roles và phân quyền. System roles không thể xóa.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {processedRoles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                            />
                        ))}
                    </div>
                    {processedRoles.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Chưa có role nào trong hệ thống
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
