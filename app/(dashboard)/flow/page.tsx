import type { Metadata } from 'next'
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder'

export const metadata: Metadata = {
    title: 'Flow - Allinone',
    description: 'Visual workflow builder để tự động hóa API, bot, dữ liệu và tác vụ.',
}

export default function FlowPage() {
    return (
        <div className="-m-3 h-[calc(100vh-4rem)] min-h-[620px] overflow-hidden sm:-m-4 lg:-m-6">
            <WorkflowBuilder />
        </div>
    )
}
