import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { getModuleStatuses } from '@/lib/actions/admin'
import { ModuleList } from '@/components/admin/ModuleList'

export default async function AdminModulesPage() {
    const statuses = await getModuleStatuses()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Quản lý Modules</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Modules</CardTitle>
                    <CardDescription>
                        Bật/Tắt các công cụ trên hệ thống. Khi tắt, người dùng sẽ không thấy và không thể truy cập công cụ đó.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ModuleList initialStatuses={statuses} />
                </CardContent>
            </Card>
        </div>
    )
}
