/**
 * Admin Audit Logs Page
 * View system audit logs with filtering
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogItem } from '@/components/admin/LogItem'
import { StatsCard } from '@/components/admin/StatsCard'
import { Activity, Clock, Users } from 'lucide-react'

import { AuditLog } from '@/types/database'

export default async function AdminLogsPage() {
    const supabase = await createClient()

    // Optimized: Fetch only needed columns and limit to 50
    const { data: logs } = await supabase
        .from('audit_logs')
        .select('id, user_id, action, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(50)
        .returns<AuditLog[]>()

    // Optimized stats calculation
    const totalLogs = logs?.length || 0
    const uniqueUsers = logs ? new Set(logs.filter(l => l.user_id).map(l => l.user_id)).size : 0
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000
    const recentLogs = logs?.filter(l => new Date(l.created_at).getTime() > dayAgo).length || 0

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Total Logs"
                    value={totalLogs}
                    description="Last 50 entries"
                    icon={Activity}
                />
                <StatsCard
                    title="Last 24h"
                    value={recentLogs}
                    description="Recent activity"
                    icon={Clock}
                />
                <StatsCard
                    title="Active Users"
                    value={uniqueUsers}
                    description="Unique users"
                    icon={Users}
                />
            </div>

            {/* Logs Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Audit Logs</CardTitle>
                    <CardDescription>
                        Lịch sử hoạt động hệ thống (50 logs gần nhất)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        {logs?.map((log) => (
                            <LogItem key={log.id} log={log} />
                        ))}
                    </div>
                    {!logs || logs.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Chưa có log nào trong hệ thống
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
