import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getModuleStatuses } from '@/lib/actions/admin'
import { ModuleList } from '@/components/admin/ModuleList'
import { getModuleCatalog, syncModuleCatalog } from '@/lib/modules/catalog'
import { StatsCard } from '@/components/admin/StatsCard'
import { CheckCircle2, Folder, ToggleLeft, Wrench } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/authorization-middleware'

export default async function AdminModulesPage() {
    await requireAdmin()
    await syncModuleCatalog()
    const [moduleCatalog, statuses] = await Promise.all([
        getModuleCatalog(),
        getModuleStatuses(),
    ])
    const enabledCount = moduleCatalog.filter((moduleItem) => statuses[moduleItem.key] ?? moduleItem.isEnabled).length
    const categories = new Set(moduleCatalog.map((moduleItem) => moduleItem.category))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Quản lý modules</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Bật/tắt công cụ trong catalog. Module đã tắt sẽ bị ẩn và chặn truy cập phía dashboard/tools.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Modules" value={moduleCatalog.length} description="Đồng bộ từ database" icon={Wrench} />
                <StatsCard title="Đang bật" value={enabledCount} description="Có thể truy cập" icon={CheckCircle2} />
                <StatsCard title="Đang tắt" value={moduleCatalog.length - enabledCount} description="Bị chặn" icon={ToggleLeft} />
                <StatsCard title="Categories" value={categories.size} description="Nhóm công cụ" icon={Folder} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách modules</CardTitle>
                    <CardDescription>
                        Catalog module được đọc từ database và tự merge fallback khi schema chưa đồng bộ.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ModuleList modules={moduleCatalog} initialStatuses={statuses} />
                </CardContent>
            </Card>
        </div>
    )
}
