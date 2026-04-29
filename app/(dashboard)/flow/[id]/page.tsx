import type { Metadata } from 'next'
import { Workflow } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder'

interface PageProps {
    params: Promise<{ id: string }>
}

export const metadata: Metadata = {
    title: 'Edit Flow - Allinone',
    description: 'Chỉnh sửa workflow automation trong Allinone Flow.',
}

export default async function FlowEditorPage({ params }: PageProps) {
    const { id } = await params

    return (
        <ToolShell
            title="Flow"
            description="Chỉnh sửa workflow automation, chạy thử và theo dõi logs realtime."
            icon={Workflow}
            className="max-w-none"
        >
            <WorkflowBuilder workflowId={id} />
        </ToolShell>
    )
}
