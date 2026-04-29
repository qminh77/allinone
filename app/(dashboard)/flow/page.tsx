import type { Metadata } from 'next'
import { Workflow } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder'

export const metadata: Metadata = {
    title: 'Flow - Allinone',
    description: 'Visual workflow builder để tự động hóa HTTP, AI, Flashcard, QR Code và Supabase.',
}

export default function FlowPage() {
    return (
        <ToolShell
            title="Flow"
            description="Xây workflow automation bằng canvas kéo-thả, custom nodes, Supabase persistence, execution history và realtime logs."
            icon={Workflow}
            className="max-w-none"
        >
            <WorkflowBuilder />
        </ToolShell>
    )
}
