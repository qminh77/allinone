import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { modules } from '@/config/modules'
import { getModuleStatuses } from '@/lib/actions/admin' // Helper we created
import { ModuleToggle } from '@/components/admin/ModuleToggle'

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
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="border-b">
                                    <th className="h-10 px-4 text-left align-middle font-medium">Module Name</th>
                                    <th className="h-10 px-4 text-left align-middle font-medium">Key</th>
                                    <th className="h-10 px-4 text-left align-middle font-medium">Category</th>
                                    <th className="h-10 px-4 text-right align-middle font-medium">Status (On/Off)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modules.map((m) => (
                                    <tr key={m.key} className="border-b hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium flex items-center gap-2">
                                            <m.icon className="h-4 w-4 text-muted-foreground" />
                                            {m.name}
                                        </td>
                                        <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                                            {m.key}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {m.category}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <ModuleToggle
                                                moduleKey={m.key}
                                                initialEnabled={statuses[m.key] ?? true}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
