import { z } from 'zod'
import type { XYPosition } from '@xyflow/react'
import type { WorkflowCanvasNode, WorkflowNodeData, WorkflowNodeType } from '@/types/workflow'

const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
const SupabaseOperationSchema = z.enum(['select', 'insert', 'update', 'delete'])
const ConditionOperatorSchema = z.enum(['equals', 'notEquals', 'contains', 'exists', 'greaterThan', 'lessThan'])
const QrTypeSchema = z.enum(['url', 'text', 'email', 'phone', 'sms', 'wifi', 'vcard', 'location', 'event', 'social', 'crypto', 'file', 'app'])

const JsonTextSchema = z.string().trim().max(20_000)

export const TriggerConfigSchema = z.object({
    mode: z.enum(['manual', 'schedule', 'webhook']).default('manual'),
    samplePayload: JsonTextSchema.optional().default('{}'),
})

export const HttpRequestConfigSchema = z.object({
    method: HttpMethodSchema.default('GET'),
    url: z.string().trim().min(1, 'URL không được để trống.').max(2048),
    headers: JsonTextSchema.optional().default('{}'),
    body: JsonTextSchema.optional().default(''),
    timeoutMs: z.coerce.number().int().min(1000).max(120_000).default(30_000),
    failOnError: z.coerce.boolean().default(true),
})

export const AiAgentConfigSchema = z.object({
    system: z.string().trim().max(3000).optional().default('You are a helpful automation agent.'),
    prompt: z.string().trim().min(1, 'Prompt không được để trống.').max(20_000),
    modelDbId: z.string().uuid().optional().nullable(),
    temperature: z.coerce.number().min(0).max(2).default(0.35),
    maxTokens: z.coerce.number().int().min(64).max(8000).default(1200),
    outputKey: z.string().trim().max(80).optional().default('text'),
})

export const FlashcardGeneratorConfigSchema = z.object({
    topic: z.string().trim().min(3, 'Chủ đề quá ngắn.').max(1000),
    count: z.coerce.number().int().min(1).max(50).default(12),
    language: z.string().trim().max(80).optional().default('Vietnamese'),
    notes: z.string().trim().max(1500).optional().default(''),
    setId: z.string().uuid().optional().nullable(),
    modelDbId: z.string().uuid().optional().nullable(),
})

export const QrGeneratorConfigSchema = z.object({
    type: QrTypeSchema.default('text'),
    content: z.string().trim().min(1, 'Nội dung QR không được để trống.').max(4000),
    foreground: z.string().regex(/^#[0-9a-f]{6}$/i).default('#111827'),
    background: z.string().regex(/^#[0-9a-f]{6}$/i).default('#ffffff'),
    size: z.coerce.number().int().min(200).max(2000).default(800),
})

export const SupabaseQueryConfigSchema = z.object({
    table: z.string().trim().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Tên bảng không hợp lệ.'),
    operation: SupabaseOperationSchema.default('select'),
    columns: z.string().trim().max(500).optional().default('*'),
    filters: JsonTextSchema.optional().default('{}'),
    payload: JsonTextSchema.optional().default('{}'),
    limit: z.coerce.number().int().min(1).max(500).default(50),
})

export const ConditionConfigSchema = z.object({
    left: z.string().trim().min(1).max(1000),
    operator: ConditionOperatorSchema.default('equals'),
    right: z.string().trim().max(1000).optional().default(''),
})

export const LoopConfigSchema = z.object({
    itemsPath: z.string().trim().min(1).max(500).default('input.items'),
    maxIterations: z.coerce.number().int().min(1).max(100).default(10),
})

export type NodeConfigSchema =
    | typeof TriggerConfigSchema
    | typeof HttpRequestConfigSchema
    | typeof AiAgentConfigSchema
    | typeof FlashcardGeneratorConfigSchema
    | typeof QrGeneratorConfigSchema
    | typeof SupabaseQueryConfigSchema
    | typeof ConditionConfigSchema
    | typeof LoopConfigSchema

export interface WorkflowNodeDefinition {
    type: WorkflowNodeType
    label: string
    description: string
    category: 'Trigger' | 'Logic' | 'Action' | 'Data'
    defaultConfig: Record<string, unknown>
    configSchema: NodeConfigSchema
}

export const WORKFLOW_NODE_DEFINITIONS: WorkflowNodeDefinition[] = [
    {
        type: 'trigger',
        label: 'Manual Trigger',
        description: 'Điểm bắt đầu flow, hỗ trợ manual/schedule/webhook.',
        category: 'Trigger',
        defaultConfig: { mode: 'manual', samplePayload: '{}' },
        configSchema: TriggerConfigSchema,
    },
    {
        type: 'aiAgent',
        label: 'AI Agent',
        description: 'Gọi AI provider động đã cấu hình trong AdminCP.',
        category: 'Action',
        defaultConfig: {
            system: 'You are a helpful automation agent.',
            prompt: 'Summarize this input: {{input.text}}',
            modelDbId: null,
            temperature: 0.35,
            maxTokens: 1200,
            outputKey: 'text',
        },
        configSchema: AiAgentConfigSchema,
    },
    {
        type: 'condition',
        label: 'Condition',
        description: 'Rẽ nhánh true/false dựa trên dữ liệu runtime.',
        category: 'Logic',
        defaultConfig: { left: '{{input.status}}', operator: 'equals', right: 'approved' },
        configSchema: ConditionConfigSchema,
    },
    {
        type: 'loop',
        label: 'Loop',
        description: 'Chuẩn bị lặp qua một mảng dữ liệu với giới hạn an toàn.',
        category: 'Logic',
        defaultConfig: { itemsPath: 'input.items', maxIterations: 10 },
        configSchema: LoopConfigSchema,
    },
    {
        type: 'httpRequest',
        label: 'HTTP Request',
        description: 'Gọi REST API với headers/body dạng JSON hoặc template.',
        category: 'Action',
        defaultConfig: {
            method: 'GET',
            url: 'https://api.example.com/data',
            headers: '{}',
            body: '',
            timeoutMs: 30_000,
            failOnError: true,
        },
        configSchema: HttpRequestConfigSchema,
    },
    {
        type: 'flashcardGenerator',
        label: 'Flashcard Generator',
        description: 'Dùng AI tạo flashcards và có thể import vào một set hiện có.',
        category: 'Action',
        defaultConfig: {
            topic: 'Next.js App Router basics',
            count: 12,
            language: 'Vietnamese',
            notes: '',
            setId: null,
            modelDbId: null,
        },
        configSchema: FlashcardGeneratorConfigSchema,
    },
    {
        type: 'qrGenerator',
        label: 'QR Generator',
        description: 'Sinh payload QR tương thích QR Code Generator hiện có.',
        category: 'Action',
        defaultConfig: {
            type: 'text',
            content: 'Hello from Allinone Flow',
            foreground: '#111827',
            background: '#ffffff',
            size: 800,
        },
        configSchema: QrGeneratorConfigSchema,
    },
    {
        type: 'supabaseQuery',
        label: 'Supabase Query',
        description: 'CRUD qua Supabase client hiện tại, tôn trọng RLS của user.',
        category: 'Data',
        defaultConfig: {
            table: 'user_profiles',
            operation: 'select',
            columns: '*',
            filters: '{}',
            payload: '{}',
            limit: 50,
        },
        configSchema: SupabaseQueryConfigSchema,
    },
]

export const WORKFLOW_NODE_DEFINITION_BY_TYPE = new Map(
    WORKFLOW_NODE_DEFINITIONS.map(definition => [definition.type, definition])
)

export function getWorkflowNodeDefinition(type: WorkflowNodeType) {
    const definition = WORKFLOW_NODE_DEFINITION_BY_TYPE.get(type)
    if (!definition) throw new Error(`Unsupported workflow node type: ${type}`)
    return definition
}

export function validateWorkflowNodeData(data: WorkflowNodeData) {
    const definition = getWorkflowNodeDefinition(data.nodeType)
    return definition.configSchema.safeParse(data.config)
}

export function createWorkflowNode(
    type: WorkflowNodeType,
    position: XYPosition,
    id = `${type}-${Date.now().toString(36)}`
): WorkflowCanvasNode {
    const definition = getWorkflowNodeDefinition(type)

    return {
        id,
        type,
        position,
        data: {
            label: definition.label,
            nodeType: type,
            description: definition.description,
            config: { ...definition.defaultConfig },
            status: 'idle',
        },
    }
}

export function createDefaultWorkflowNodes(): WorkflowCanvasNode[] {
    return [createWorkflowNode('trigger', { x: 80, y: 160 }, 'trigger-1')]
}
