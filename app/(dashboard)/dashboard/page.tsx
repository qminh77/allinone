import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUserProfile } from '@/lib/auth/session'
import { Activity, Shield, User, Zap } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { getModuleStatuses } from '@/lib/actions/admin'

export default async function DashboardPage() {
    const profile = await getCurrentUserProfile()
    const enabledModules = await getModuleStatuses()

    // @ts-ignore
    const roleName = profile?.role?.name || 'Guest'
    const isActive = profile?.is_active

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
                    <p className="text-muted-foreground mt-1">
                        Chào mừng trở lại, <span className="font-semibold text-foreground">{profile?.full_name}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full text-sm font-medium">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>{roleName}</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats - Minimalist */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-none border-border/50 bg-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Trạng thái
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isActive ? (
                                <span className="text-green-600">Active</span>
                            ) : (
                                <span className="text-red-600">Inactive</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-none border-border/50 bg-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Công cụ
                        </CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {/* Simple count of enabled modules */}
                            {Object.values(enabledModules).filter(v => v !== false).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content: Searchable Modules Grid */}
            <DashboardShell enabledModules={enabledModules} />
        </div>
    )
}
