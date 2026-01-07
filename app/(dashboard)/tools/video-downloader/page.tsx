import { ToolShell } from '@/components/dashboard/ToolShell'
import { VideoDownloader } from '@/components/tools/VideoDownloader'
import { Download } from 'lucide-react'

export const metadata = {
    title: 'Video Downloader - UMTERS Tools',
    description: 'Tải xuống Video/Audio chất lượng cao từ YouTube, TikTok...',
}

export default function VideoDownloaderPage() {
    return (
        <ToolShell
            title="Video Downloader"
            description="Công cụ tải video đa năng hỗ trợ YouTube, TikTok, Facebook, Twitter... sử dụng yt-dlp core."
            icon={Download}
        >
            <VideoDownloader />
        </ToolShell>
    )
}
