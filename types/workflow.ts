import { z } from 'zod'
import type { Edge, Node, Viewport } from '@xyflow/react'

export const WorkflowNodeTypeSchema = z.enum([
    'trigger',
    'condition',
    'loop',
    'httpRequest',
    'aiAgent',
    'flashcardGenerator',
    'qrGenerator',
    'supabaseQuery',
    'telegramBot',
    'zaloBot',
])

export const WorkflowStatusSchema = z.enum(['draft', 'active', 'archived'])
export const WorkflowExecutionStatusSchema = z.enum(['queued', 'running', 'success', 'failed', 'cancelled'])
export const WorkflowTriggerTypeSchema = z.enum(['manual', 'schedule', 'api'])
export const WorkflowLogLevelSchema = z.enum(['debug', 'info', 'warn', 'error'])
export const WorkflowNodeRunStatusSchema = z.enum(['idle', 'running', 'success', 'failed', 'skipped'])

export type WorkflowNodeType = z.infer<typeof WorkflowNodeTypeSchema>
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>
export type WorkflowExecutionStatus = z.infer<typeof WorkflowExecutionStatusSchema>
export type WorkflowTriggerType = z.infer<typeof WorkflowTriggerTypeSchema>
export type WorkflowLogLevel = z.infer<typeof WorkflowLogLevelSchema>
export type WorkflowNodeRunStatus = z.infer<typeof WorkflowNodeRunStatusSchema>

export type JsonRecord = Record<string, unknown>

export interface WorkflowNodeData extends Record<string, unknown> {
    label: string
    nodeType: WorkflowNodeType
    description?: string
    config: JsonRecord
    status?: WorkflowNodeRunStatus
    lastRun?: {
        status: WorkflowNodeRunStatus
        durationMs?: number
        message?: string
    }
}

export type WorkflowCanvasNode = Node<WorkflowNodeData, WorkflowNodeType>
export type WorkflowCanvasEdge = Edge<JsonRecord>

export interface WorkflowDefinition {
    version: 1
    nodes: WorkflowCanvasNode[]
    edges: WorkflowCanvasEdge[]
    viewport?: Viewport
    variables?: JsonRecord
}

export interface WorkflowRecord {
    id: string
    user_id: string
    name: string
    description: string | null
    status: WorkflowStatus
    definition: WorkflowDefinition
    schedule_cron: string | null
    last_run_at: string | null
    created_at: string
    updated_at: string
}

export interface WorkflowExecutionRecord {
    id: string
    workflow_id: string
    user_id: string
    status: WorkflowExecutionStatus
    trigger_type: WorkflowTriggerType
    input: JsonRecord
    output: JsonRecord | null
    started_at: string | null
    completed_at: string | null
    duration_ms: number | null
    error_message: string | null
    created_at: string
}

export interface WorkflowExecutionLogRecord {
    id: string
    execution_id: string
    workflow_id: string
    user_id: string
    node_id: string | null
    level: WorkflowLogLevel
    message: string
    payload: JsonRecord | null
    created_at: string
}

const JsonRecordSchema = z.record(z.string(), z.unknown())

export const WorkflowNodeDataSchema = z.object({
    label: z.string().trim().min(1).max(120),
    nodeType: WorkflowNodeTypeSchema,
    description: z.string().trim().max(500).optional().default(''),
    config: JsonRecordSchema.default({}),
    status: WorkflowNodeRunStatusSchema.optional(),
    lastRun: z.object({
        status: WorkflowNodeRunStatusSchema,
        durationMs: z.number().int().nonnegative().optional(),
        message: z.string().max(500).optional(),
    }).optional(),
})

export const WorkflowCanvasNodeSchema = z.object({
    id: z.string().trim().min(1).max(120),
    type: WorkflowNodeTypeSchema.optional(),
    position: z.object({
        x: z.number().finite(),
        y: z.number().finite(),
    }),
    data: WorkflowNodeDataSchema,
    selected: z.boolean().optional(),
    dragging: z.boolean().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    measured: z.object({
        width: z.number().optional(),
        height: z.number().optional(),
    }).optional(),
}).passthrough().transform(node => ({
    ...node,
    type: node.type || node.data.nodeType,
}))

export const WorkflowCanvasEdgeSchema = z.object({
    id: z.string().trim().min(1).max(160),
    source: z.string().trim().min(1),
    target: z.string().trim().min(1),
    sourceHandle: z.string().nullable().optional(),
    targetHandle: z.string().nullable().optional(),
    label: z.string().trim().max(80).optional(),
    type: z.string().trim().max(80).optional(),
    animated: z.boolean().optional(),
    data: JsonRecordSchema.optional(),
}).passthrough()

export const WorkflowDefinitionSchema = z.object({
    version: z.literal(1).default(1),
    nodes: z.array(WorkflowCanvasNodeSchema).max(200),
    edges: z.array(WorkflowCanvasEdgeSchema).max(400),
    viewport: z.object({
        x: z.number().finite(),
        y: z.number().finite(),
        zoom: z.number().positive(),
    }).optional(),
    variables: JsonRecordSchema.optional(),
}).superRefine((definition, context) => {
    const nodeIds = new Set<string>()

    for (const node of definition.nodes) {
        if (nodeIds.has(node.id)) {
            context.addIssue({
                code: 'custom',
                path: ['nodes'],
                message: `Duplicate node id: ${node.id}`,
            })
        }
        nodeIds.add(node.id)
    }

    for (const edge of definition.edges) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            context.addIssue({
                code: 'custom',
                path: ['edges'],
                message: `Edge ${edge.id} references a missing node.`,
            })
        }
    }
})

export const WorkflowSaveInputSchema = z.object({
    name: z.string().trim().min(3, 'Tên flow phải có ít nhất 3 ký tự.').max(160),
    description: z.string().trim().max(2000).optional().nullable(),
    status: WorkflowStatusSchema.default('draft'),
    scheduleCron: z.string().trim().max(120).optional().nullable(),
    definition: WorkflowDefinitionSchema,
})

export const WorkflowRunInputSchema = z.object({
    triggerType: WorkflowTriggerTypeSchema.default('manual'),
    input: JsonRecordSchema.optional().default({}),
})

export const WorkflowAiGenerateInputSchema = z.object({
    prompt: z.string().trim().min(10, 'Mô tả workflow quá ngắn.').max(3000),
    modelDbId: z.string().uuid().optional().nullable(),
})

export function parseWorkflowDefinition(input: unknown): WorkflowDefinition {
    return WorkflowDefinitionSchema.parse(input) as WorkflowDefinition
}
