import { BrainCircuit } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { DashboardAiCommand } from '@/components/ai/DashboardAiCommand'

export default function AiAssistantPage() {
    return (
        <ToolShell
            title="AI Assistant"
            description="Nhập tác vụ để AI mở đúng chức năng trong hệ thống."
            icon={BrainCircuit}
        >
            <div className="max-w-3xl">
                <DashboardAiCommand showModelSelect />
            </div>
        </ToolShell>
    )
}
