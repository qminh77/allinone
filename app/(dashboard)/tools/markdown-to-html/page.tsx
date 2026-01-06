import { ToolShell } from '@/components/dashboard/ToolShell'
import { MarkdownConverter } from '@/components/tools/MarkdownConverter'
import { FileType } from 'lucide-react'

export default function MarkdownPage() {
    return (
        <ToolShell
            title="Markdown to HTML"
            description="Chuyển đổi văn bản Markdown sang HTML với chế độ xem trước trực tiếp (Live Preview)"
            icon={FileType}
        >
            <MarkdownConverter />
        </ToolShell>
    )
}
