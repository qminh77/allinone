'use client'

import '@xyflow/react/dist/style.css'

import { useEffect, useRef, useState, startTransition, type ChangeEvent, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react'
import { Download, FileJson, FolderOpen, LayoutDashboard, Play, Plus, Save, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ExecutionPanel } from '@/components/workflows/ExecutionPanel'
import { NodeEditor } from '@/components/workflows/NodeEditor'
import { NodeLibrary } from '@/components/workflows/NodeLibrary'
import { WorkflowAIAssistant } from '@/components/workflows/WorkflowAIAssistant'
import { workflowNodeTypes } from '@/components/workflows/nodes'
import { useWorkflowStore } from '@/components/workflows/store/useWorkflowStore'
import { cn } from '@/lib/utils'
import { WorkflowNodeTypeSchema, type WorkflowRecord } from '@/types/workflow'

interface WorkflowBuilderProps {
    workflowId?: string
}

function WorkflowLoadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [workflows, setWorkflows] = useState<WorkflowRecord[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const listWorkflows = useWorkflowStore(state => state.listWorkflows)

    const refresh = async (nextQuery = query) => {
        setIsLoading(true)
        try {
            setWorkflows(await listWorkflows(nextQuery))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể tải danh sách flow.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!open) return

        setIsLoading(true)
        listWorkflows('')
            .then(setWorkflows)
            .catch(error => {
                toast.error(error instanceof Error ? error.message : 'Không thể tải danh sách flow.')
            })
            .finally(() => setIsLoading(false))
    }, [open, listWorkflows])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Load workflow</DialogTitle>
                    <DialogDescription>Chọn một flow đã lưu trong Supabase để mở lại trên canvas.</DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Tìm theo tên flow..."
                    />
                    <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isLoading}>Tìm</Button>
                </div>
                <ScrollArea className="max-h-80 rounded-lg border">
                    <div className="space-y-2 p-3">
                        {workflows.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                {isLoading ? 'Đang tải...' : 'Chưa có workflow phù hợp.'}
                            </p>
                        ) : workflows.map(workflow => (
                            <button
                                key={workflow.id}
                                type="button"
                                onClick={() => {
                                    onOpenChange(false)
                                    startTransition(() => router.push(`/flow/${workflow.id}`))
                                }}
                                className="w-full rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/60"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">{workflow.name}</p>
                                        <p className="truncate text-xs text-muted-foreground">{workflow.description || 'Không có mô tả'}</p>
                                    </div>
                                    <Badge variant="secondary" className="shrink-0">{workflow.status}</Badge>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function WorkflowRunDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [input, setInput] = useState('{}')
    const isRunning = useWorkflowStore(state => state.isRunning)
    const runWorkflow = useWorkflowStore(state => state.runWorkflow)

    const run = async () => {
        try {
            const parsedInput = JSON.parse(input) as unknown
            if (!parsedInput || typeof parsedInput !== 'object' || Array.isArray(parsedInput)) {
                throw new Error('Run input phải là JSON object.')
            }

            const result = await runWorkflow(parsedInput as Record<string, unknown>)
            if (result.success) toast.success('Flow chạy thành công.')
            else toast.error(result.error || 'Flow chạy thất bại.')
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Run input không hợp lệ.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Run workflow</DialogTitle>
                    <DialogDescription>Nhập manual input JSON. Dữ liệu này dùng qua template <code>{'{{input.key}}'}</code>.</DialogDescription>
                </DialogHeader>
                <Textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    className="min-h-40 font-mono text-xs"
                />
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isRunning}>Hủy</Button>
                    <Button type="button" onClick={run} disabled={isRunning}>
                        {isRunning ? 'Đang chạy...' : 'Run now'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function WorkflowBuilderInner({ workflowId }: WorkflowBuilderProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loadOpen, setLoadOpen] = useState(false)
    const [runOpen, setRunOpen] = useState(false)
    const { screenToFlowPosition, fitView } = useReactFlow()

    const id = useWorkflowStore(state => state.workflowId)
    const name = useWorkflowStore(state => state.name)
    const description = useWorkflowStore(state => state.description)
    const status = useWorkflowStore(state => state.status)
    const scheduleCron = useWorkflowStore(state => state.scheduleCron)
    const nodes = useWorkflowStore(state => state.nodes)
    const edges = useWorkflowStore(state => state.edges)
    const isDirty = useWorkflowStore(state => state.isDirty)
    const isLoading = useWorkflowStore(state => state.isLoading)
    const isSaving = useWorkflowStore(state => state.isSaving)
    const isRunning = useWorkflowStore(state => state.isRunning)
    const error = useWorkflowStore(state => state.error)
    const setMeta = useWorkflowStore(state => state.setMeta)
    const resetWorkflow = useWorkflowStore(state => state.resetWorkflow)
    const loadWorkflow = useWorkflowStore(state => state.loadWorkflow)
    const saveWorkflow = useWorkflowStore(state => state.saveWorkflow)
    const duplicateWorkflow = useWorkflowStore(state => state.duplicateWorkflow)
    const deleteWorkflow = useWorkflowStore(state => state.deleteWorkflow)
    const exportDefinition = useWorkflowStore(state => state.exportDefinition)
    const importDefinition = useWorkflowStore(state => state.importDefinition)
    const autoLayout = useWorkflowStore(state => state.autoLayout)
    const onNodesChange = useWorkflowStore(state => state.onNodesChange)
    const onEdgesChange = useWorkflowStore(state => state.onEdgesChange)
    const onConnect = useWorkflowStore(state => state.onConnect)
    const addNode = useWorkflowStore(state => state.addNode)
    const setSelectedNodeId = useWorkflowStore(state => state.setSelectedNodeId)

    useEffect(() => {
        if (workflowId) {
            void loadWorkflow(workflowId).catch(error => {
                toast.error(error instanceof Error ? error.message : 'Không thể tải flow.')
            })
        } else {
            resetWorkflow()
        }
    }, [workflowId, loadWorkflow, resetWorkflow])

    const save = async () => {
        const wasNew = !id
        try {
            const workflow = await saveWorkflow()
            toast.success('Đã lưu flow.')
            if (wasNew) startTransition(() => router.replace(`/flow/${workflow.id}`))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể lưu flow.')
        }
    }

    const duplicate = async () => {
        try {
            const workflow = await duplicateWorkflow()
            toast.success('Đã duplicate flow.')
            startTransition(() => router.push(`/flow/${workflow.id}`))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể duplicate flow.')
        }
    }

    const remove = async () => {
        if (!window.confirm('Xóa workflow này? Hành động này không thể hoàn tác.')) return

        try {
            await deleteWorkflow()
            toast.success('Đã xóa flow.')
            startTransition(() => router.push('/flow'))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể xóa flow.')
        }
    }

    const createNew = () => {
        if (isDirty && !window.confirm('Flow hiện tại chưa lưu. Tạo flow mới?')) return
        resetWorkflow()
        startTransition(() => router.push('/flow'))
    }

    const exportJson = () => {
        const blob = new Blob([exportDefinition()], { type: 'application/json;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'workflow'}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        try {
            const text = await file.text()
            const parsed = JSON.parse(text) as { definition?: unknown; name?: string; description?: string | null }
            importDefinition(parsed.definition || parsed, { name: parsed.name, description: parsed.description })
            toast.success('Đã import workflow JSON.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'File workflow JSON không hợp lệ.')
        }
    }

    const onDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }

    const onDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        const nodeType = event.dataTransfer.getData('application/allinone-flow-node')
        const parsed = WorkflowNodeTypeSchema.safeParse(nodeType)
        if (!parsed.success) return

        addNode(parsed.data, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
                        <div className="space-y-2">
                            <Label htmlFor="workflow-name">Tên Flow</Label>
                            <Input
                                id="workflow-name"
                                value={name}
                                onChange={(event) => setMeta({ name: event.target.value })}
                                className="bg-background text-base font-semibold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workflow-status">Status</Label>
                            <Select value={status} onValueChange={(value) => setMeta({ status: value as typeof status })}>
                                <SelectTrigger id="workflow-status" className="bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workflow-schedule">Schedule cron</Label>
                            <Input
                                id="workflow-schedule"
                                value={scheduleCron}
                                onChange={(event) => setMeta({ scheduleCron: event.target.value })}
                                placeholder="0 8 * * *"
                                className="bg-background font-mono"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="workflow-description">Mô tả</Label>
                            <Textarea
                                id="workflow-description"
                                value={description}
                                onChange={(event) => setMeta({ description: event.target.value })}
                                placeholder="Flow này làm gì, input/output ra sao..."
                                className="min-h-20 bg-background"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:max-w-md xl:justify-end">
                        <Badge variant={isDirty ? 'default' : 'secondary'}>{isDirty ? 'Unsaved' : 'Saved'}</Badge>
                        {error && <Badge variant="destructive" className="max-w-64 truncate">{error}</Badge>}
                        <Button type="button" variant="outline" size="sm" onClick={createNew}>
                            <Plus className="size-4" />
                            New
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setLoadOpen(true)}>
                            <FolderOpen className="size-4" />
                            Load
                        </Button>
                        <Button type="button" size="sm" onClick={() => void save()} disabled={isSaving || isLoading}>
                            <Save className="size-4" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setRunOpen(true)} disabled={isRunning}>
                            <Play className="size-4" />
                            Run
                        </Button>
                        <WorkflowAIAssistant />
                        <Button type="button" variant="outline" size="sm" onClick={duplicate} disabled={!id}>
                            <FileJson className="size-4" />
                            Duplicate
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={exportJson}>
                            <Download className="size-4" />
                            Export
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="size-4" />
                            Import
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={autoLayout}>
                            <LayoutDashboard className="size-4" />
                            Auto layout
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={!id}>
                            <Trash2 className="size-4" />
                            Delete
                        </Button>
                        <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
                <div className="flex min-h-[760px] overflow-hidden rounded-2xl border bg-background shadow-sm lg:flex-row flex-col">
                    <NodeLibrary />
                    <div className="relative min-h-[560px] flex-1 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_28rem)]">
                        {isLoading && (
                            <div className="absolute inset-0 z-20 grid place-items-center bg-background/70 text-sm text-muted-foreground backdrop-blur-sm">
                                Đang tải workflow...
                            </div>
                        )}
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={workflowNodeTypes}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onPaneClick={() => setSelectedNodeId(null)}
                            fitView
                            deleteKeyCode={['Backspace', 'Delete']}
                            className={cn('workflow-canvas', isLoading && 'pointer-events-none')}
                        >
                            <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} />
                            <Controls position="bottom-left" />
                            <MiniMap pannable zoomable position="bottom-right" />
                        </ReactFlow>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fitView({ padding: 0.2, duration: 300 })}
                            className="absolute left-4 top-4 z-10 shadow-sm"
                        >
                            Fit view
                        </Button>
                    </div>
                </div>

                <div className="flex min-h-[760px] flex-col gap-4">
                    <NodeEditor />
                    <ExecutionPanel />
                </div>
            </div>

            <WorkflowLoadDialog open={loadOpen} onOpenChange={setLoadOpen} />
            <WorkflowRunDialog open={runOpen} onOpenChange={setRunOpen} />
        </div>
    )
}

export function WorkflowBuilder(props: WorkflowBuilderProps) {
    return (
        <ReactFlowProvider>
            <WorkflowBuilderInner {...props} />
        </ReactFlowProvider>
    )
}
