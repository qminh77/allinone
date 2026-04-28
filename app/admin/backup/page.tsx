import { BackupManagement } from '@/components/admin/backups/BackupManagement'
import { StatsCard } from '@/components/admin/StatsCard'
import { getBackups } from '@/lib/actions/admin/backups'
import { Database, Download, HardDrive } from 'lucide-react'

interface BackupRow {
    id: string
    filename: string
    type: string
    size_bytes: number | null
    created_at: string
    created_by: string | null
    storage_path: string | null
}

function formatBytes(bytes: number): string {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

export default async function AdminBackupPage() {
    const backups = (await getBackups()) as BackupRow[]
    const totalSize = backups.reduce((sum, backup) => sum + (backup.size_bytes || 0), 0)
    const latestBackup = backups[0]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Backups</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tạo, tải xuống và xóa bản sao lưu JSON cho dữ liệu quản trị chính.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard title="Total Backups" value={backups.length} description="50 bản mới nhất" icon={Database} />
                <StatsCard title="Total Size" value={formatBytes(totalSize)} description="Dung lượng metadata" icon={HardDrive} />
                <StatsCard
                    title="Latest Backup"
                    value={latestBackup ? new Date(latestBackup.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    description="Bản gần nhất"
                    icon={Download}
                />
            </div>

            <BackupManagement backups={backups} />
        </div>
    )
}
