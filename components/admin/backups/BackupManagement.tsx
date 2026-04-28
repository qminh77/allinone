'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Database, Download, Loader2, Plus, Trash2 } from 'lucide-react'
import { createDatabaseBackup, deleteBackup, getBackupDownloadUrl } from '@/lib/actions/admin/backups'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface Backup {
    id: string
    filename: string
    type: string
    size_bytes: number | null
    created_at: string
    created_by: string | null
    storage_path: string | null
}

interface BackupManagementProps {
    backups: Backup[]
}

function formatBytes(bytes: number): string {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

export function BackupManagement({ backups }: BackupManagementProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [backupToDelete, setBackupToDelete] = useState<Backup | null>(null)

    const handleCreate = () => {
        startTransition(async () => {
            const result = await createDatabaseBackup()
            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success('Đã tạo backup database')
            router.refresh()
        })
    }

    const handleDownload = (backup: Backup) => {
        startTransition(async () => {
            const result = await getBackupDownloadUrl(backup.id)
            if (result.error || !result.url) {
                toast.error(result.error || 'Không thể tạo link tải')
                return
            }

            window.open(result.url, '_blank', 'noopener,noreferrer')
        })
    }

    const handleDelete = () => {
        if (!backupToDelete) return

        startTransition(async () => {
            const result = await deleteBackup(backupToDelete.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Đã xóa backup')
                router.refresh()
            }
            setBackupToDelete(null)
        })
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Quản lý backups</CardTitle>
                            <CardDescription>
                                Tạo file JSON backup cho dữ liệu public chính, lưu trong Supabase Storage riêng tư.
                            </CardDescription>
                        </div>
                        <Button onClick={handleCreate} disabled={isPending}>
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                            Tạo backup
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Filename</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {backups.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            <Database className="mx-auto mb-3 size-10 opacity-30" />
                                            Chưa có backup nào
                                        </TableCell>
                                    </TableRow>
                                )}
                                {backups.map((backup) => (
                                    <TableRow key={backup.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-mono text-sm font-medium">{backup.filename}</p>
                                                <p className="font-mono text-xs text-muted-foreground">{backup.storage_path || '-'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{backup.type}</Badge>
                                        </TableCell>
                                        <TableCell>{formatBytes(backup.size_bytes || 0)}</TableCell>
                                        <TableCell>{new Date(backup.created_at).toLocaleString('vi-VN')}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDownload(backup)}
                                                    disabled={isPending || !backup.storage_path}
                                                    title="Tải backup"
                                                >
                                                    <Download className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setBackupToDelete(backup)}
                                                    disabled={isPending}
                                                    title="Xóa backup"
                                                >
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!backupToDelete} onOpenChange={(nextOpen) => !nextOpen && setBackupToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa backup?</AlertDialogTitle>
                        <AlertDialogDescription>
                            File &quot;{backupToDelete?.filename}&quot; và metadata tương ứng sẽ bị xóa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
