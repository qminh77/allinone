import { Badge } from '@/components/ui/badge'
import { getCurrentUserProfile } from '@/lib/auth/session'
import { Activity, Shield, Zap } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { getModuleCatalog } from '@/lib/modules/catalog'

export default async function DashboardPage() {
    const [profile, moduleCatalog] = await Promise.all([
        getCurrentUserProfile(),
        getModuleCatalog(),
    ])

    const roleName = profile?.role?.name || 'Guest'
    const isActive = profile?.is_active
    const enabledCount = moduleCatalog.filter(moduleItem => moduleItem.isEnabled !== false).length

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tổng quan</h1>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                        Chào mừng trở lại, <span className="font-semibold text-foreground">{profile?.full_name}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="h-8 gap-1.5 px-3">
                        <Shield className="size-3.5" />
                        {roleName}
                    </Badge>
                    <Badge variant={isActive ? 'secondary' : 'outline'} className="h-8 gap-1.5 px-3">
                        <Activity className="size-3.5" />
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="secondary" className="h-8 gap-1.5 px-3">
                        <Zap className="size-3.5" />
                        {enabledCount} công cụ
                    </Badge>
                </div>
            </div>

            <DashboardShell modules={moduleCatalog} />
        </div>
    )
}
