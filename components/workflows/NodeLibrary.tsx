'use client'

import {
    Bot,
    BookOpen,
    Database,
    GitBranch,
    Globe2,
    PlayCircle,
    QrCode,
    Repeat2,
    Search,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { WORKFLOW_NODE_DEFINITIONS } from '@/lib/workflows/registry'
import { cn } from '@/lib/utils'
import type { WorkflowNodeType } from '@/types/workflow'
import { useWorkflowStore } from '@/components/workflows/store/useWorkflowStore'
import { useState, type DragEvent } from 'react'

const iconByType: Record<WorkflowNodeType, LucideIcon> = {
    trigger: PlayCircle,
    condition: GitBranch,
    loop: Repeat2,
    httpRequest: Globe2,
    aiAgent: Bot,
    flashcardGenerator: BookOpen,
    qrGenerator: QrCode,
    supabaseQuery: Database,
}

const accentByType: Record<WorkflowNodeType, string> = {
    trigger: 'bg-slate-700',
    condition: 'bg-fuchsia-600',
    loop: 'bg-indigo-600',
    httpRequest: 'bg-blue-600',
    aiAgent: 'bg-violet-600',
    flashcardGenerator: 'bg-amber-600',
    qrGenerator: 'bg-emerald-600',
    supabaseQuery: 'bg-teal-600',
}

export function NodeLibrary() {
    const [query, setQuery] = useState('')
    const addNode = useWorkflowStore(state => state.addNode)
    const normalizedQuery = query.trim().toLowerCase()
    const nodes = WORKFLOW_NODE_DEFINITIONS.filter(node => {
        if (!normalizedQuery) return true
        return [node.label, node.description, node.category, node.type]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
    })

    const onDragStart = (event: DragEvent<HTMLButtonElement>, type: WorkflowNodeType) => {
        event.dataTransfer.setData('application/allinone-flow-node', type)
        event.dataTransfer.effectAllowed = 'move'
    }

    return (
        <aside className="flex h-full w-full flex-col border-b bg-card/70 lg:w-80 lg:border-b-0 lg:border-r">
            <div className="space-y-3 border-b p-4">
                <div>
                    <h2 className="text-sm font-semibold">Nodes Library</h2>
                    <p className="text-xs text-muted-foreground">Kéo node vào canvas hoặc click để thêm nhanh.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Tìm node..."
                        className="h-9 bg-background pl-9"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-2 p-3">
                    {nodes.map(node => {
                        const Icon = iconByType[node.type]
                        return (
                            <Button
                                key={node.type}
                                type="button"
                                variant="ghost"
                                draggable
                                onDragStart={(event) => onDragStart(event, node.type)}
                                onClick={() => addNode(node.type)}
                                className="h-auto w-full justify-start gap-3 rounded-xl border bg-background/70 p-3 text-left hover:bg-muted/70"
                            >
                                <span className={cn('rounded-lg p-2 text-white shadow-sm', accentByType[node.type])}>
                                    <Icon className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1 space-y-1">
                                    <span className="flex items-center gap-2">
                                        <span className="truncate text-sm font-medium">{node.label}</span>
                                        <Badge variant="secondary" className="h-5 shrink-0 rounded-full px-2 text-[10px]">
                                            {node.category}
                                        </Badge>
                                    </span>
                                    <span className="line-clamp-2 text-xs font-normal text-muted-foreground">{node.description}</span>
                                </span>
                            </Button>
                        )
                    })}
                </div>
            </ScrollArea>
        </aside>
    )
}
