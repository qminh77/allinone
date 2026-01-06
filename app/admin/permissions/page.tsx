/**
 * Admin Permissions Page
 * Permissions management organized by modules
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/admin/StatsCard'
import { Key, Folder, Shield } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

export default async function AdminPermissionsPage() {
    const supabase = await createClient()

    const { data: permissions } = (await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })
        .order('key', { ascending: true })) as { data: any[] | null }

    // Group permissions by module
    const permissionsByModule: Record<string, any[]> = {}
    permissions?.forEach(perm => {
        const module = perm.module || 'other'
        if (!permissionsByModule[module]) {
            permissionsByModule[module] = []
        }
        permissionsByModule[module].push(perm)
    })

    // Calculate stats
    const totalPermissions = permissions?.length || 0
    const totalModules = Object.keys(permissionsByModule).length
    const avgPerModule = totalModules > 0
        ? Math.round(totalPermissions / totalModules)
        : 0

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Total Permissions"
                    value={totalPermissions}
                    description="All system permissions"
                    icon={Key}
                />
                <StatsCard
                    title="Modules"
                    value={totalModules}
                    description="Permission categories"
                    icon={Folder}
                />
                <StatsCard
                    title="Avg per Module"
                    value={avgPerModule}
                    description="Permissions per category"
                    icon={Shield}
                />
            </div>

            {/* Permissions by Module */}
            <Card>
                <CardHeader>
                    <CardTitle>Quản lý Permissions</CardTitle>
                    <CardDescription>
                        Danh sách tất cả quyền hạn, được nhóm theo module
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full">
                        {Object.entries(permissionsByModule).map(([module, perms]) => (
                            <AccordionItem key={module} value={module}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{module}</Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {perms.length} permissions
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Key</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Description</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {perms.map((perm) => (
                                                <TableRow key={perm.id}>
                                                    <TableCell className="font-mono text-xs">
                                                        {perm.key}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {perm.name}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {perm.description || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    {totalPermissions === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Chưa có permission nào trong hệ thống
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
