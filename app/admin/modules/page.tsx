import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getModuleStatuses } from '@/lib/actions/admin'
import { ModuleList } from '@/components/admin/ModuleList'
import { syncModuleCatalog } from '@/lib/modules/catalog'
import { modules } from '@/config/modules'
import { StatsCard } from '@/components/admin/StatsCard'
import { CheckCircle2, Folder, ToggleLeft, Wrench } from 'lucide-react'

export default async function AdminModulesPage() {
    await syncModuleCatalog()
    const statuses = await getModuleStatuses()
    const enabledCount = modules.filter((moduleItem) => statuses[moduleItem.key] ?? true).length
    const categories = new Set(modules.map((moduleItem) => moduleItem.category))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Quản lý modules</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Bật/tắt công cụ trong catalog. Module đã tắt sẽ bị ẩn và chặn truy cập phía dashboard/tools.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Modules" value={modules.length} description="Từ config/modules.ts" icon={Wrench} />
                <StatsCard title="Đang bật" value={enabledCount} description="Có thể truy cập" icon={CheckCircle2} />
                <StatsCard title="Đang tắt" value={modules.length - enabledCount} description="Bị chặn" icon={ToggleLeft} />
                <StatsCard title="Categories" value={categories.size} description="Nhóm công cụ" icon={Folder} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách modules</CardTitle>
                    <CardDescription>
                        Catalog module lấy từ mã nguồn, trạng thái bật/tắt lưu trong database.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ModuleList initialStatuses={statuses} />
                </CardContent>
            </Card>
        </div>
    )
}
