'use client'

import {
    Bot,
    BookOpen,
    Database,
    GitBranch,
    Globe2,
    MessageCircle,
    PlayCircle,
    QrCode,
    Repeat2,
    Search,
    Send,
    Sparkles,
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
    telegramBot: Send,
    zaloBot: MessageCircle,
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
    telegramBot: 'bg-sky-600',
    zaloBot: 'bg-blue-500',
}

interface NodePreset {
    label: string
    description: string
    type: WorkflowNodeType
    config: Record<string, unknown>
}

const nodePresets: NodePreset[] = [
    {
        label: 'AI chat input',
        description: 'Nhận {{input.message}} và trả về answer.',
        type: 'aiAgent',
        config: {
            system: 'You are a concise Vietnamese assistant.',
            prompt: 'Trả lời người dùng bằng tiếng Việt.\n\nUser: {{input.message}}',
            outputKey: 'answer',
        },
    },
    {
        label: 'HTTP POST JSON',
        description: 'Gửi JSON body từ input tới API.',
        type: 'httpRequest',
        config: {
            method: 'POST',
            url: 'https://api.example.com/items',
            headers: '{"Content-Type":"application/json","Authorization":"Bearer {{input.apiToken}}"}',
            body: '{"message":"{{input.message}}","date":"{{today()}}"}',
        },
    },
    {
        label: 'Telegram reply',
        description: 'Gửi message tới chatId từ input.',
        type: 'telegramBot',
        config: {
            method: 'sendMessage',
            chatId: '{{input.telegramChatId}}',
            text: '{{input.message}}',
        },
    },
    {
        label: 'Zalo reply',
        description: 'Gửi message tới Zalo chatId từ input.',
        type: 'zaloBot',
        config: {
            method: 'sendMessage',
            chatId: '{{input.zaloChatId}}',
            text: '{{input.message}}',
        },
    },
    {
        label: 'Quiz-style flashcards',
        description: 'Tạo flashcard theo thuật toán quiz.',
        type: 'flashcardGenerator',
        config: {
            topic: '{{input.topic}}',
            count: 12,
            difficulty: 'trung bình',
            notes: 'Tạo câu hỏi rõ ràng, có đáp án và giải thích ngắn.',
        },
    },
]

export function NodeLibrary() {
    const [query, setQuery] = useState('')
    const addNode = useWorkflowStore(state => state.addNode)
    const updateNodeData = useWorkflowStore(state => state.updateNodeData)
    const updateNodeConfig = useWorkflowStore(state => state.updateNodeConfig)
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

    const addPreset = (preset: NodePreset) => {
        const nodeId = addNode(preset.type)
        updateNodeData(nodeId, {
            label: preset.label,
            description: preset.description,
        })
        Object.entries(preset.config).forEach(([key, value]) => updateNodeConfig(nodeId, key, value))
    }

    return (
        <aside className="flex h-full min-h-[320px] w-full min-w-0 flex-col border-b bg-card/80 lg:min-h-0 lg:w-[300px] lg:border-b-0 lg:border-r xl:w-80">
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

            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-2 p-3">
                    <div className="space-y-2 rounded-xl border bg-background/70 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <Sparkles className="size-3.5" />
                            Quick nodes
                        </div>
                        <div className="space-y-2">
                            {nodePresets.map(preset => (
                                <Button
                                    key={preset.label}
                                    type="button"
                                    variant="ghost"
                                    onClick={() => addPreset(preset)}
                                    className="h-auto w-full justify-start whitespace-normal rounded-lg border bg-muted/30 p-2 text-left hover:bg-muted/70"
                                >
                                    <span className="min-w-0 space-y-0.5">
                                        <span className="block truncate text-xs font-medium">{preset.label}</span>
                                        <span className="line-clamp-2 text-[11px] font-normal text-muted-foreground">{preset.description}</span>
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </div>

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
                                className="h-auto w-full justify-start gap-3 whitespace-normal rounded-xl border bg-background/70 p-3 text-left hover:bg-muted/70"
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
