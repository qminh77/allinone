import { ToolShell } from '@/components/dashboard/ToolShell'
import { VideoDownloader } from '@/components/tools/VideoDownloader'
import { Download } from 'lucide-react'

export const metadata = {
    title: 'Video Downloader - UMTERS Tools',
    description: 'Tải xuống Video/Audio từ YouTube.',
}

export default function VideoDownloaderPage() {
    return (
        <ToolShell
            title="Video Downloader"
            description="Công cụ lấy link tải Video/Audio từ YouTube, chạy được trên Vercel mà không cần Python runtime."
            icon={Download}
        >
            <VideoDownloader />
        </ToolShell>
    )
}
