import { BrainCircuit } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { AiAssistantChat } from '@/components/ai/AiAssistantChat'

export default function AiAssistantPage() {
    return (
        <ToolShell
            title="AI Assistant"
            description="Chat với trợ lý AI để hỏi đáp, soạn nội dung và mở nhanh chức năng trong hệ thống."
            icon={BrainCircuit}
        >
            <AiAssistantChat />
        </ToolShell>
    )
}
