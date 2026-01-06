import { ToolShell } from '@/components/dashboard/ToolShell'
import { PingTool } from '@/components/tools/PingTool'
import { Activity } from 'lucide-react'

export default function PingPage() {
    return (
        <ToolShell
            title="Ping & Port Check"
            description="Kiểm tra trạng thái website và port server"
            icon={Activity}
        >
            <PingTool />
        </ToolShell>
    )
}
