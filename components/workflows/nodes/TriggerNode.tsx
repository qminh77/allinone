'use client'

import type { NodeProps } from '@xyflow/react'
import { PlayCircle } from 'lucide-react'
import { BaseWorkflowNode } from '@/components/workflows/nodes/BaseWorkflowNode'
import type { WorkflowCanvasNode } from '@/types/workflow'

export function TriggerNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
    return (
        <BaseWorkflowNode data={data} selected={selected} icon={PlayCircle} accentClassName="bg-slate-700">
            <span className="capitalize">Mode: {String(data.config.mode || 'manual')}</span>
        </BaseWorkflowNode>
    )
}
