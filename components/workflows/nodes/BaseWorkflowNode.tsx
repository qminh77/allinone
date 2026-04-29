'use client'

import { Handle, Position } from '@xyflow/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData } from '@/types/workflow'

interface BaseWorkflowNodeProps {
    data: WorkflowNodeData
    selected?: boolean
    icon: LucideIcon
    accentClassName: string
    children?: ReactNode
    sourceHandles?: ReactNode
    hideDefaultSource?: boolean
}

const statusClassName = {
    idle: 'border-muted-foreground/30 bg-muted/60 text-muted-foreground',
    running: 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    failed: 'border-destructive/40 bg-destructive/10 text-destructive',
    skipped: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300',
}

export function BaseWorkflowNode({
    data,
    selected,
    icon: Icon,
    accentClassName,
    children,
    sourceHandles,
    hideDefaultSource = false,
}: BaseWorkflowNodeProps) {
    const status = data.status || 'idle'

    return (
        <div
            className={cn(
                'relative min-w-64 rounded-xl border bg-card/95 p-3 text-card-foreground shadow-lg backdrop-blur transition-all',
                selected ? 'border-primary shadow-primary/15 ring-2 ring-primary/20' : 'border-border/80 hover:border-primary/40'
            )}
        >
            <Handle type="target" position={Position.Left} className="!size-3 !border-2 !border-background !bg-primary" />

            <div className="flex items-start gap-3">
                <div className={cn('rounded-lg p-2 text-white shadow-sm', accentClassName)}>
                    <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold">{data.label}</h3>
                        <Badge variant="outline" className={cn('h-5 rounded-full px-2 text-[10px]', statusClassName[status])}>
                            {status}
                        </Badge>
                    </div>
                    {data.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{data.description}</p>
                    )}
                </div>
            </div>

            {children && <div className="mt-3 rounded-lg border bg-muted/30 p-2 text-xs text-muted-foreground">{children}</div>}

            {sourceHandles}
            {!hideDefaultSource && (
                <Handle type="source" position={Position.Right} className="!size-3 !border-2 !border-background !bg-primary" />
            )}
        </div>
    )
}
