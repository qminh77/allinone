'use client'

import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import { BaseWorkflowNode } from '@/components/workflows/nodes/BaseWorkflowNode'
import type { WorkflowCanvasNode } from '@/types/workflow'

export function ConditionNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
    return (
        <BaseWorkflowNode
            data={data}
            selected={selected}
            icon={GitBranch}
            accentClassName="bg-fuchsia-600"
            hideDefaultSource
            sourceHandles={(
                <>
                    <Handle id="true" type="source" position={Position.Right} className="!top-[38%] !size-3 !border-2 !border-background !bg-emerald-500" />
                    <Handle id="false" type="source" position={Position.Right} className="!top-[68%] !size-3 !border-2 !border-background !bg-red-500" />
                </>
            )}
        >
            <div className="space-y-1 font-mono">
                <p className="line-clamp-1">{String(data.config.left || '')}</p>
                <p>{String(data.config.operator || 'equals')} {String(data.config.right || '')}</p>
            </div>
        </BaseWorkflowNode>
    )
}
