'use client'

import type { NodeProps } from '@xyflow/react'
import { QrCode } from 'lucide-react'
import { BaseWorkflowNode } from '@/components/workflows/nodes/BaseWorkflowNode'
import type { WorkflowCanvasNode } from '@/types/workflow'

export function QrGeneratorNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
    return (
        <BaseWorkflowNode data={data} selected={selected} icon={QrCode} accentClassName="bg-emerald-600">
            <div className="space-y-1">
                <p className="uppercase tracking-wide">{String(data.config.type || 'text')}</p>
                <p className="line-clamp-1 font-mono">{String(data.config.content || '')}</p>
            </div>
        </BaseWorkflowNode>
    )
}
