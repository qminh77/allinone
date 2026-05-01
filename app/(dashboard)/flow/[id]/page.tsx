import type { Metadata } from 'next'
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
        <div className="-m-3 h-[calc(100vh-4rem)] min-h-[620px] overflow-hidden sm:-m-4 lg:-m-6">
            <WorkflowBuilder workflowId={id} />
        </div>
    )
}
