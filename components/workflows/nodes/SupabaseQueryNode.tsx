'use client'

import type { NodeProps } from '@xyflow/react'
import { Database } from 'lucide-react'
import { BaseWorkflowNode } from '@/components/workflows/nodes/BaseWorkflowNode'
import type { WorkflowCanvasNode } from '@/types/workflow'

export function SupabaseQueryNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
    return (
        <BaseWorkflowNode data={data} selected={selected} icon={Database} accentClassName="bg-teal-600">
            <div className="flex items-center gap-2 font-mono">
                <span>{String(data.config.operation || 'select')}</span>
                <span className="text-muted-foreground">from</span>
                <span>{String(data.config.table || 'table')}</span>
            </div>
        </BaseWorkflowNode>
    )
}
