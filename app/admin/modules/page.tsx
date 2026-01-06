/**
 * Admin Modules Page
 * Tool modules management
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModuleCard } from '@/components/admin/ModuleCard'
import { StatsCard } from '@/components/admin/StatsCard'
import { Wrench, CheckCircle, XCircle } from 'lucide-react'

export default async function AdminModulesPage() {
    const supabase = await createClient()

    const { data: modules } = await supabase
        .from('modules')
        .select('*')
        .order('sort_order', { ascending: true })

    // Calculate stats
    const totalModules = modules?.length || 0
    const enabledModules = modules?.filter(m => m.is_enabled).length || 0
    const disabledModules = totalModules - enabledModules

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Total Modules"
                    value={totalModules}
                    description="All tool modules"
                    icon={Wrench}
                />
                <StatsCard
                    title="Enabled"
                    value={enabledModules}
                    description="Active modules"
                    icon={CheckCircle}
                />
                <StatsCard
                    title="Disabled"
                    value={disabledModules}
                    description="Inactive modules"
                    icon={XCircle}
                />
            </div>

            {/* Modules List */}
            <Card>
                <CardHeader>
                    <CardTitle>Quản lý Tool Modules</CardTitle>
                    <CardDescription>
                        Bật/tắt các công cụ và quản lý thứ tự hiển thị
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {modules?.map((module) => (
                            <ModuleCard
                                key={module.id}
                                module={module}
                            />
                        ))}
                    </div>
                    {!modules || modules.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Chưa có module nào trong hệ thống
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
