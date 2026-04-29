'use client'

import type { NodeProps } from '@xyflow/react'
import { Bot } from 'lucide-react'
import { BaseWorkflowNode } from '@/components/workflows/nodes/BaseWorkflowNode'
import type { WorkflowCanvasNode } from '@/types/workflow'

export function AiAgentNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
    return (
        <BaseWorkflowNode data={data} selected={selected} icon={Bot} accentClassName="bg-violet-600">
            <p className="line-clamp-2">{String(data.config.prompt || 'Prompt chưa cấu hình')}</p>
        </BaseWorkflowNode>
    )
}
