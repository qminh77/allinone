import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/admin/StatsCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Activity,
    ArrowRight,
    Database,
    Key,
    Settings,
    Shield,
    Users,
    Wrench,
} from 'lucide-react'

async function getCount(table: 'user_profiles' | 'roles' | 'permissions' | 'modules' | 'audit_logs' | 'backups') {
    const supabase = await createClient()
    const db = supabase as any
    const { count } = await db
        .from(table)
        .select('*', { count: 'exact', head: true })

    return count || 0
}

export default async function AdminPage() {
    const supabase = await createClient()
    const db = supabase as any
    const [
        userCount,
        roleCount,
        permissionCount,
        moduleCount,
        logCount,
        backupCount,
        enabledModulesResult,
        recentLogsResult,
    ] = await Promise.all([
        getCount('user_profiles'),
        getCount('roles'),
        getCount('permissions'),
        getCount('modules'),
        getCount('audit_logs'),
        getCount('backups'),
        db.from('modules').select('id', { count: 'exact', head: true }).eq('is_enabled', true),
        db
            .from('audit_logs')
            .select('id, action, resource_type, created_at')
            .order('created_at', { ascending: false })
            .limit(6),
    ])

    const enabledModules = enabledModulesResult.count || 0
    const recentLogs = (recentLogsResult.data || []) as Array<{
        id: string
        action: string
        resource_type: string | null
        created_at: string
    }>

    const actions = [
        { href: '/admin/users', label: 'Quản lý người dùng', icon: Users, description: 'Tạo tài khoản, đổi role, khóa truy cập.' },
        { href: '/admin/roles', label: 'Quản lý vai trò', icon: Shield, description: 'CRUD role và gán permissions.' },
        { href: '/admin/permissions', label: 'Quản lý quyền hạn', icon: Key, description: 'CRUD permission key theo module.' },
        { href: '/admin/modules', label: 'Bật tắt modules', icon: Wrench, description: 'Kiểm soát tool hiển thị cho người dùng.' },
        { href: '/admin/settings', label: 'Cấu hình hệ thống', icon: Settings, description: 'CRUD setting JSON có kiểm soát.' },
        { href: '/admin/backup', label: 'Backups', icon: Database, description: 'Theo dõi bản sao lưu hệ thống.' },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">AdminCP</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Trung tâm quản trị người dùng, phân quyền, module và cấu hình hệ thống.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/users">
                        <Users className="size-4" />
                        Thêm người dùng
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatsCard title="Người dùng" value={userCount} description="Tài khoản trong hệ thống" icon={Users} />
                <StatsCard title="Vai trò" value={roleCount} description={`${permissionCount} permissions`} icon={Shield} />
                <StatsCard title="Modules" value={`${enabledModules}/${moduleCount}`} description="Đang bật / tổng số" icon={Wrench} />
                <StatsCard title="Audit logs" value={logCount} description={`${backupCount} backup records`} icon={Activity} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Chức năng quản trị</CardTitle>
                        <CardDescription>Đi nhanh tới các khu vực CRUD và kiểm soát vận hành.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            {actions.map((action) => {
                                const Icon = action.icon

                                return (
                                    <Link
                                        key={action.href}
                                        href={action.href}
                                        className="group rounded-md border bg-background p-4 transition-colors hover:bg-muted/60"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex gap-3">
                                                <div className="grid size-10 place-items-center rounded-md bg-muted">
                                                    <Icon className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{action.label}</p>
                                                    <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hoạt động gần đây</CardTitle>
                        <CardDescription>6 audit logs mới nhất.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentLogs.length === 0 && (
                                <p className="py-8 text-center text-sm text-muted-foreground">Chưa có log nào.</p>
                            )}
                            {recentLogs.map((log) => (
                                <div key={log.id} className="rounded-md border bg-background p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <Badge variant="outline">{log.action}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {log.resource_type || 'system'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
