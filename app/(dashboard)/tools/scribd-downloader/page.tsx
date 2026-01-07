import { ToolShell } from '@/components/dashboard/ToolShell'
import { ScribdDownloader } from '@/components/tools/ScribdDownloader'
import { FileText } from 'lucide-react'

export const metadata = {
    title: 'Scribd Downloader - UMTERS Tools',
    description: 'Tải tài liệu PDF từ Scribd miễn phí',
}

export default function ScribdPage() {
    return (
        <ToolShell
            title="Scribd Downloader"
            description="Công cụ tải tài liệu PDF từ Scribd miễn phí, không cần tài khoản VIP. Hỗ trợ tải sách, tài liệu học tập."
            icon={FileText}
        >
            <ScribdDownloader />
        </ToolShell>
    )
}
