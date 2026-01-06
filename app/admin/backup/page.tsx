/**
 * Admin Backup Page
 * Backup management interface
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/admin/StatsCard'
import { Database, Download, HardDrive, Plus } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

import { Backup } from '@/types/database'

export default async function AdminBackupPage() {
    const supabase = await createClient()

    // Optimized: Limit results and select only needed columns
    const { data: backups } = await supabase
        .from('backups')
        .select('id, filename, type, size_bytes, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(20)
        .returns<Backup[]>() // Pagination: show 20 most recent backups

    // Optimized: Calculate stats from limited dataset
    const totalBackups = backups?.length || 0
    const totalSize = backups?.reduce((sum, b) => sum + (b.size_bytes || 0), 0) || 0
    const latestBackup = backups?.[0]

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Total Backups"
                    value={totalBackups}
                    description="All backup files"
                    icon={Database}
                />
                <StatsCard
                    title="Total Size"
                    value={formatBytes(totalSize)}
                    description="Storage used"
                    icon={HardDrive}
                />
                <StatsCard
                    title="Latest Backup"
                    value={latestBackup
                        ? new Date(latestBackup.created_at).toLocaleDateString('vi-VN')
                        : 'N/A'
                    }
                    description="Most recent"
                    icon={Download}
                />
            </div>

            {/* Backup Actions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Quản lý Backups</CardTitle>
                            <CardDescription>
                                20 bản sao lưu gần nhất
                            </CardDescription>
                        </div>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tạo Backup Mới
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Filename</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {backups?.map((backup) => (
                                <TableRow key={backup.id}>
                                    <TableCell className="font-medium font-mono text-sm">
                                        {backup.filename}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {backup.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {formatBytes(backup.size_bytes || 0)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(backup.created_at).toLocaleString('vi-VN')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {!backups || backups.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Chưa có backup nào</p>
                            <p className="text-sm mt-1">Click "Tạo Backup Mới" để bắt đầu</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
