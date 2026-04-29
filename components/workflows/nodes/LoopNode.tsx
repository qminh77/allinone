'use client'

import type { NodeProps } from '@xyflow/react'
import { Repeat2 } from 'lucide-react'
import { BaseWorkflowNode } from '@/components/workflows/nodes/BaseWorkflowNode'
import type { WorkflowCanvasNode } from '@/types/workflow'

export function LoopNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
    return (
        <BaseWorkflowNode data={data} selected={selected} icon={Repeat2} accentClassName="bg-indigo-600">
            <div className="space-y-1 font-mono">
                <p>{String(data.config.itemsPath || 'input.items')}</p>
                <p>max {String(data.config.maxIterations || 10)}</p>
            </div>
        </BaseWorkflowNode>
    )
}
