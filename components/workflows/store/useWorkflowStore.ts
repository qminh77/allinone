'use client'

import {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    type Connection,
    type EdgeChange,
    type NodeChange,
    type XYPosition,
} from '@xyflow/react'
import { create } from 'zustand'
import { createDefaultWorkflowNodes, createWorkflowNode } from '@/lib/workflows/registry'
import type {
    WorkflowCanvasEdge,
    WorkflowCanvasNode,
    WorkflowDefinition,
    WorkflowExecutionLogRecord,
    WorkflowExecutionRecord,
    WorkflowNodeData,
    WorkflowNodeType,
    WorkflowRecord,
    WorkflowStatus,
} from '@/types/workflow'
import { parseWorkflowDefinition } from '@/types/workflow'

interface WorkflowApiResponse {
    workflow: WorkflowRecord
}

interface WorkflowListApiResponse {
    workflows: WorkflowRecord[]
}

interface WorkflowRunApiResponse {
    success: boolean
    execution: WorkflowExecutionRecord
    output: Record<string, unknown> | null
    error: string | null
    logs: WorkflowExecutionLogRecord[]
}

interface WorkflowExecutionsApiResponse {
    executions: WorkflowExecutionRecord[]
}

interface WorkflowExecutionDetailApiResponse {
    execution: WorkflowExecutionRecord
    logs: WorkflowExecutionLogRecord[]
}

interface WorkflowStoreState {
    workflowId: string | null
    name: string
    description: string
    status: WorkflowStatus
    scheduleCron: string
    nodes: WorkflowCanvasNode[]
    edges: WorkflowCanvasEdge[]
    selectedNodeId: string | null
    activeExecutionId: string | null
    executions: WorkflowExecutionRecord[]
    logs: WorkflowExecutionLogRecord[]
    isDirty: boolean
    isLoading: boolean
    isSaving: boolean
    isRunning: boolean
    error: string | null
    resetWorkflow: () => void
    setWorkflow: (workflow: WorkflowRecord) => void
    setMeta: (meta: Partial<Pick<WorkflowStoreState, 'name' | 'description' | 'status' | 'scheduleCron'>>) => void
    onNodesChange: (changes: NodeChange<WorkflowCanvasNode>[]) => void
    onEdgesChange: (changes: EdgeChange<WorkflowCanvasEdge>[]) => void
    onConnect: (connection: Connection) => void
    addNode: (type: WorkflowNodeType, position?: XYPosition) => string
    setSelectedNodeId: (nodeId: string | null) => void
    updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void
    updateNodeConfig: (nodeId: string, key: string, value: unknown) => void
    deleteNode: (nodeId: string) => void
    autoLayout: () => void
    exportDefinition: () => string
    importDefinition: (definition: unknown, meta?: { name?: string; description?: string | null }) => void
    loadWorkflow: (id: string) => Promise<WorkflowRecord>
    saveWorkflow: () => Promise<WorkflowRecord>
    duplicateWorkflow: () => Promise<WorkflowRecord>
    deleteWorkflow: () => Promise<void>
    listWorkflows: (query?: string) => Promise<WorkflowRecord[]>
    runWorkflow: (input?: Record<string, unknown>) => Promise<WorkflowRunApiResponse>
    loadExecutionHistory: () => Promise<WorkflowExecutionRecord[]>
    loadExecutionDetail: (executionId: string) => Promise<WorkflowExecutionDetailApiResponse>
    appendLog: (log: WorkflowExecutionLogRecord) => void
}

function defaultState() {
    return {
        workflowId: null,
        name: 'Untitled Flow',
        description: '',
        status: 'draft' as WorkflowStatus,
        scheduleCron: '',
        nodes: createDefaultWorkflowNodes(),
        edges: [] as WorkflowCanvasEdge[],
        selectedNodeId: null,
        activeExecutionId: null,
        executions: [] as WorkflowExecutionRecord[],
        logs: [] as WorkflowExecutionLogRecord[],
        isDirty: false,
        isLoading: false,
        isSaving: false,
        isRunning: false,
        error: null,
    }
}

async function readJson<T>(response: Response): Promise<T> {
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
        const message = typeof data?.error === 'string' ? data.error : 'Request failed.'
        throw new Error(message)
    }

    return data as T
}

function currentDefinition(state: WorkflowStoreState): WorkflowDefinition {
    return parseWorkflowDefinition({
        version: 1,
        nodes: state.nodes,
        edges: state.edges,
    })
}

export const useWorkflowStore = create<WorkflowStoreState>((set, get) => ({
    ...defaultState(),

    resetWorkflow: () => set(defaultState()),

    setWorkflow: (workflow) => set({
        workflowId: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        status: workflow.status,
        scheduleCron: workflow.schedule_cron || '',
        nodes: workflow.definition.nodes,
        edges: workflow.definition.edges,
        selectedNodeId: null,
        activeExecutionId: null,
        logs: [],
        isDirty: false,
        error: null,
    }),

    setMeta: (meta) => set(state => ({
        ...meta,
        isDirty: true,
        scheduleCron: meta.scheduleCron ?? state.scheduleCron,
    })),

    onNodesChange: (changes) => set(state => {
        const selected = changes.find(change => change.type === 'select' && change.selected)
        return {
            nodes: applyNodeChanges(changes, state.nodes) as WorkflowCanvasNode[],
            selectedNodeId: selected && 'id' in selected ? selected.id : state.selectedNodeId,
            isDirty: true,
        }
    }),

    onEdgesChange: (changes) => set(state => ({
        edges: applyEdgeChanges(changes, state.edges) as WorkflowCanvasEdge[],
        isDirty: true,
    })),

    onConnect: (connection) => set(state => ({
        edges: addEdge({ ...connection, type: 'smoothstep', animated: true }, state.edges) as WorkflowCanvasEdge[],
        isDirty: true,
    })),

    addNode: (type, position = { x: 180, y: 180 }) => {
        let nodeId = ''
        set(state => {
            const node = createWorkflowNode(type, position, `${type}-${Date.now().toString(36)}-${state.nodes.length + 1}`)
            nodeId = node.id

            return {
                nodes: [...state.nodes, node],
                selectedNodeId: node.id,
                isDirty: true,
            }
        })

        return nodeId
    },

    setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

    updateNodeData: (nodeId, data) => set(state => ({
        nodes: state.nodes.map(node => node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node),
        isDirty: true,
    })),

    updateNodeConfig: (nodeId, key, value) => set(state => ({
        nodes: state.nodes.map(node => node.id === nodeId
            ? { ...node, data: { ...node.data, config: { ...node.data.config, [key]: value } } }
            : node),
        isDirty: true,
    })),

    deleteNode: (nodeId) => set(state => ({
        nodes: state.nodes.filter(node => node.id !== nodeId),
        edges: state.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        isDirty: true,
    })),

    autoLayout: () => set(state => {
        const incomingCount = new Map<string, number>()
        const childrenByNode = new Map<string, string[]>()

        for (const node of state.nodes) incomingCount.set(node.id, 0)
        for (const edge of state.edges) {
            incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1)
            childrenByNode.set(edge.source, [...(childrenByNode.get(edge.source) || []), edge.target])
        }

        const roots = state.nodes.filter(node => (incomingCount.get(node.id) || 0) === 0)
        const layers = new Map<string, number>()
        const queue = roots.map(node => ({ id: node.id, layer: 0 }))

        while (queue.length > 0) {
            const item = queue.shift()
            if (!item) continue
            if ((layers.get(item.id) ?? -1) >= item.layer) continue
            layers.set(item.id, item.layer)
            for (const child of childrenByNode.get(item.id) || []) queue.push({ id: child, layer: item.layer + 1 })
        }

        const layerIndexes = new Map<number, number>()
        const nodes = state.nodes.map((node, index) => {
            const layer = layers.get(node.id) ?? Math.floor(index / 3)
            const layerIndex = layerIndexes.get(layer) || 0
            layerIndexes.set(layer, layerIndex + 1)

            return {
                ...node,
                position: {
                    x: 80 + layer * 340,
                    y: 120 + layerIndex * 170,
                },
            }
        })

        return { nodes, isDirty: true }
    }),

    exportDefinition: () => JSON.stringify(currentDefinition(get()), null, 2),

    importDefinition: (definition, meta) => {
        const parsed = parseWorkflowDefinition(definition)
        set(state => ({
            name: meta?.name || state.name,
            description: meta?.description ?? state.description,
            nodes: parsed.nodes,
            edges: parsed.edges,
            selectedNodeId: null,
            isDirty: true,
            error: null,
        }))
    },

    loadWorkflow: async (id) => {
        set({ isLoading: true, error: null })
        try {
            const data = await readJson<WorkflowApiResponse>(await fetch(`/api/flows/${id}`))
            get().setWorkflow(data.workflow)
            await get().loadExecutionHistory()
            return data.workflow
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tải flow.'
            set({ error: message })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    saveWorkflow: async () => {
        set({ isSaving: true, error: null })
        try {
            const state = get()
            const payload = {
                name: state.name,
                description: state.description,
                status: state.status,
                scheduleCron: state.scheduleCron || null,
                definition: currentDefinition(state),
            }
            const response = await fetch(state.workflowId ? `/api/flows/${state.workflowId}` : '/api/flows', {
                method: state.workflowId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await readJson<WorkflowApiResponse>(response)
            get().setWorkflow(data.workflow)
            return data.workflow
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể lưu flow.'
            set({ error: message })
            throw error
        } finally {
            set({ isSaving: false })
        }
    },

    duplicateWorkflow: async () => {
        const workflowId = get().workflowId
        if (!workflowId) throw new Error('Cần lưu flow trước khi duplicate.')

        const data = await readJson<WorkflowApiResponse>(await fetch(`/api/flows/${workflowId}/duplicate`, { method: 'POST' }))
        get().setWorkflow(data.workflow)
        return data.workflow
    },

    deleteWorkflow: async () => {
        const workflowId = get().workflowId
        if (!workflowId) {
            get().resetWorkflow()
            return
        }

        await readJson<{ success: boolean }>(await fetch(`/api/flows/${workflowId}`, { method: 'DELETE' }))
        get().resetWorkflow()
    },

    listWorkflows: async (query) => {
        const search = query ? `?q=${encodeURIComponent(query)}` : ''
        const data = await readJson<WorkflowListApiResponse>(await fetch(`/api/flows${search}`))
        return data.workflows
    },

    runWorkflow: async (input = {}) => {
        set({ isRunning: true, error: null, logs: [] })
        try {
            if (!get().workflowId || get().isDirty) await get().saveWorkflow()

            const workflowId = get().workflowId
            if (!workflowId) throw new Error('Không tìm thấy flow để chạy.')

            const response = await fetch(`/api/flows/${workflowId}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ triggerType: 'manual', input }),
            })
            const data = await readJson<WorkflowRunApiResponse>(response)
            set(state => ({
                activeExecutionId: data.execution.id,
                logs: data.logs,
                executions: [data.execution, ...state.executions.filter(execution => execution.id !== data.execution.id)],
                error: data.error,
            }))
            return data
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể chạy flow.'
            set({ error: message })
            throw error
        } finally {
            set({ isRunning: false })
        }
    },

    loadExecutionHistory: async () => {
        const workflowId = get().workflowId
        if (!workflowId) return []

        const data = await readJson<WorkflowExecutionsApiResponse>(await fetch(`/api/flows/${workflowId}/executions`))
        set({ executions: data.executions })
        return data.executions
    },

    loadExecutionDetail: async (executionId) => {
        const data = await readJson<WorkflowExecutionDetailApiResponse>(await fetch(`/api/flows/executions/${executionId}`))
        set({ activeExecutionId: executionId, logs: data.logs })
        return data
    },

    appendLog: (log) => set(state => {
        if (state.logs.some(existing => existing.id === log.id)) return state
        return { logs: [...state.logs, log] }
    }),
}))
