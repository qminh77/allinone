'use client'

import type { NodeProps } from '@xyflow/react'
import { Globe2 } from 'lucide-react'
import { BaseWorkflowNode } from '@/components/workflows/nodes/BaseWorkflowNode'
import type { WorkflowCanvasNode } from '@/types/workflow'

export function HttpRequestNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
    const method = String(data.config.method || 'GET')
    const url = String(data.config.url || '')

    return (
        <BaseWorkflowNode data={data} selected={selected} icon={Globe2} accentClassName="bg-blue-600">
            <div className="flex items-center gap-2">
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-blue-600 dark:text-blue-300">{method}</span>
                <span className="truncate font-mono">{url || 'https://...'}</span>
            </div>
        </BaseWorkflowNode>
    )
}
