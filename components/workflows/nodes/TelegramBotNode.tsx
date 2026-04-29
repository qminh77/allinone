'use client'

import type { NodeProps } from '@xyflow/react'
import { Send } from 'lucide-react'
import { BaseWorkflowNode } from '@/components/workflows/nodes/BaseWorkflowNode'
import type { WorkflowCanvasNode } from '@/types/workflow'

export function TelegramBotNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
    const method = String(data.config.method || 'sendMessage')
    const chatId = String(data.config.chatId || '')

    return (
        <BaseWorkflowNode data={data} selected={selected} icon={Send} accentClassName="bg-sky-600">
            <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono">
                    <span>{method}</span>
                    {chatId && <span className="truncate text-muted-foreground">to {chatId}</span>}
                </div>
                <p className="line-clamp-1">{String(data.config.text || data.config.caption || data.config.mediaUrl || 'Telegram Bot API')}</p>
            </div>
        </BaseWorkflowNode>
    )
}
