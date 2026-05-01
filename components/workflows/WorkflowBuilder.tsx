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
import { Download, FileJson, FolderOpen, LayoutDashboard, MoreHorizontal, PanelLeft, PanelRight, Play, Plus, Save, Settings2, TerminalSquare, Trash2, Upload, Workflow } from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
    const [newOpen, setNewOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [libraryOpen, setLibraryOpen] = useState(true)
    const [inspectorOpen, setInspectorOpen] = useState(true)
    const [rightPanelMode, setRightPanelMode] = useState<'editor' | 'executions'>('editor')
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
        try {
            await deleteWorkflow()
            toast.success('Đã xóa flow.')
            setDeleteOpen(false)
            startTransition(() => router.push('/flow'))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể xóa flow.')
        }
    }

    const createNew = () => {
        if (isDirty) {
            setNewOpen(true)
            return
        }

        resetWorkflow()
        startTransition(() => router.push('/flow'))
    }

    const createNewConfirmed = () => {
        setNewOpen(false)
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
        <div className="flex h-full min-h-[620px] flex-col overflow-hidden bg-background">
            <div className="shrink-0 border-b bg-card/95 px-3 py-3 shadow-sm sm:px-4 lg:px-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="hidden rounded-xl border bg-background p-2 text-muted-foreground shadow-xs sm:block">
                            <Workflow className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <Label htmlFor="workflow-name" className="sr-only">Tên Flow</Label>
                                <Input
                                    id="workflow-name"
                                    value={name}
                                    onChange={(event) => setMeta({ name: event.target.value })}
                                    className="h-9 border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0 sm:text-2xl md:max-w-xl"
                                />
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <Badge variant={isDirty ? 'default' : 'secondary'}>{isDirty ? 'Unsaved' : 'Saved'}</Badge>
                                    <Select value={status} onValueChange={(value) => setMeta({ status: value as typeof status })}>
                                        <SelectTrigger id="workflow-status" className="h-8 w-[126px] bg-background text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2 lg:grid-cols-[180px_minmax(0,1fr)]">
                                <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-xs text-muted-foreground shadow-xs">
                                    <Label htmlFor="workflow-schedule" className="shrink-0 text-xs">Cron</Label>
                                    <Input
                                        id="workflow-schedule"
                                        value={scheduleCron}
                                        onChange={(event) => setMeta({ scheduleCron: event.target.value })}
                                        placeholder="0 8 * * *"
                                        className="h-7 border-0 bg-transparent p-0 font-mono text-xs shadow-none focus-visible:ring-0"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <Label htmlFor="workflow-description" className="sr-only">Mô tả</Label>
                                    <Textarea
                                        id="workflow-description"
                                        value={description}
                                        onChange={(event) => setMeta({ description: event.target.value })}
                                        placeholder="Mô tả flow, input/output hoặc ghi chú vận hành..."
                                        className="max-h-20 min-h-9 resize-none overflow-y-auto bg-background py-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:max-w-[620px] xl:justify-end">
                        {error && <Badge variant="destructive" className="max-w-64 truncate">{error}</Badge>}
                        <Button type="button" variant={libraryOpen ? 'secondary' : 'outline'} size="sm" onClick={() => setLibraryOpen(open => !open)}>
                            <PanelLeft className="size-4" />
                            <span className="hidden sm:inline">Nodes</span>
                        </Button>
                        <Button type="button" variant={inspectorOpen ? 'secondary' : 'outline'} size="sm" onClick={() => setInspectorOpen(open => !open)}>
                            <PanelRight className="size-4" />
                            <span className="hidden sm:inline">Inspector</span>
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={createNew}>
                            <Plus className="size-4" />
                            New
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setLoadOpen(true)}>
                            <FolderOpen className="size-4" />
                            Load
                        </Button>
                        <WorkflowAIAssistant />
                        <Button type="button" size="sm" onClick={() => void save()} disabled={isSaving || isLoading}>
                            <Save className="size-4" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button type="button" variant="default" size="sm" onClick={() => { setRightPanelMode('executions'); setInspectorOpen(true); setRunOpen(true) }} disabled={isRunning}>
                            <Play className="size-4" />
                            Run
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="outline" size="sm">
                                    <MoreHorizontal className="size-4" />
                                    More
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onSelect={() => void duplicate()} disabled={!id}>
                                    <FileJson className="size-4" />
                                    Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={exportJson}>
                                    <Download className="size-4" />
                                    Export JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                                    <Upload className="size-4" />
                                    Import JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={autoLayout}>
                                    <LayoutDashboard className="size-4" />
                                    Auto layout
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)} disabled={!id}>
                                    <Trash2 className="size-4" />
                                    Delete workflow
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
                    </div>
                </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto bg-muted/30 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:overflow-hidden">
                {libraryOpen && <NodeLibrary />}

                <section className="relative min-h-[560px] min-w-0 overflow-hidden border-y bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_30rem)] lg:min-h-0 lg:border-y-0">
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
                        className={cn('workflow-canvas h-full w-full', isLoading && 'pointer-events-none')}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={24} size={1.25} />
                        <Controls position="bottom-left" />
                        <MiniMap pannable zoomable position="bottom-right" />
                    </ReactFlow>
                    <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fitView({ padding: 0.2, duration: 300 })}
                            className="shadow-sm"
                        >
                            Fit view
                        </Button>
                        {!libraryOpen && (
                            <Button type="button" variant="secondary" size="sm" onClick={() => setLibraryOpen(true)} className="shadow-sm">
                                <PanelLeft className="size-4" />
                                Nodes
                            </Button>
                        )}
                        {!inspectorOpen && (
                            <Button type="button" variant="secondary" size="sm" onClick={() => setInspectorOpen(true)} className="shadow-sm">
                                <PanelRight className="size-4" />
                                Inspector
                            </Button>
                        )}
                    </div>
                </section>

                {inspectorOpen && (
                    <aside className="flex min-h-[520px] w-full min-w-0 flex-col border-l bg-card/90 lg:min-h-0 lg:w-[420px] 2xl:w-[460px]">
                        <div className="flex shrink-0 items-center justify-between gap-2 border-b p-3">
                            <div className="inline-flex rounded-lg bg-muted p-1">
                                <Button
                                    type="button"
                                    variant={rightPanelMode === 'editor' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setRightPanelMode('editor')}
                                    className="h-8 px-3"
                                >
                                    <Settings2 className="size-4" />
                                    Editor
                                </Button>
                                <Button
                                    type="button"
                                    variant={rightPanelMode === 'executions' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setRightPanelMode('executions')}
                                    className="h-8 px-3"
                                >
                                    <TerminalSquare className="size-4" />
                                    Logs
                                </Button>
                            </div>
                            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setInspectorOpen(false)}>
                                <PanelRight className="size-4" />
                                <span className="sr-only">Ẩn inspector</span>
                            </Button>
                        </div>
                        <div className="flex min-h-0 flex-1 p-3">
                            {rightPanelMode === 'editor' ? <NodeEditor /> : <ExecutionPanel />}
                        </div>
                    </aside>
                )}
            </div>

            <WorkflowLoadDialog open={loadOpen} onOpenChange={setLoadOpen} />
            <WorkflowRunDialog open={runOpen} onOpenChange={setRunOpen} />
            <AlertDialog open={newOpen} onOpenChange={setNewOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tạo flow mới?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Flow hiện tại chưa lưu. Nếu tiếp tục, các thay đổi trên canvas hiện tại sẽ bị bỏ qua.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={createNewConfirmed}>Tạo mới</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa workflow?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ xóa workflow và toàn bộ execution/log liên quan. Không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => void remove()}>
                            Xóa workflow
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
