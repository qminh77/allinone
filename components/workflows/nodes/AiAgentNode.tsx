'use client'

import type { NodeProps } from '@xyflow/react'
import { Bot } from 'lucide-react'
import { BaseWorkflowNode } from '@/components/workflows/nodes/BaseWorkflowNode'
import type { WorkflowCanvasNode } from '@/types/workflow'

export function AiAgentNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
    const model = String(data.config.model || 'model')
    const endpoint = String(data.config.endpoint || 'custom endpoint')

    return (
        <BaseWorkflowNode data={data} selected={selected} icon={Bot} accentClassName="bg-violet-600">
            <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono">
                    <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-violet-600 dark:text-violet-300">{model}</span>
                    <span className="truncate">{endpoint}</span>
                </div>
                <p className="line-clamp-1">{String(data.config.prompt || 'Prompt chưa cấu hình')}</p>
            </div>
        </BaseWorkflowNode>
    )
}
