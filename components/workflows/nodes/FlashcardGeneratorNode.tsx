'use client'

import type { NodeProps } from '@xyflow/react'
import { BookOpen } from 'lucide-react'
import { BaseWorkflowNode } from '@/components/workflows/nodes/BaseWorkflowNode'
import type { WorkflowCanvasNode } from '@/types/workflow'

export function FlashcardGeneratorNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
    return (
        <BaseWorkflowNode data={data} selected={selected} icon={BookOpen} accentClassName="bg-amber-600">
            <div className="space-y-1">
                <p className="line-clamp-1 font-medium text-foreground">{String(data.config.topic || 'Chủ đề')}</p>
                <p>{String(data.config.count || 12)} cards</p>
            </div>
        </BaseWorkflowNode>
    )
}
