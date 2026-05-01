import { z } from 'zod'
import type { XYPosition } from '@xyflow/react'
import type { WorkflowCanvasNode, WorkflowNodeData, WorkflowNodeType } from '@/types/workflow'

const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
const SupabaseOperationSchema = z.enum(['select', 'insert', 'update', 'delete'])
const ConditionOperatorSchema = z.enum(['equals', 'notEquals', 'contains', 'exists', 'greaterThan', 'lessThan'])
const QrTypeSchema = z.enum(['url', 'text', 'email', 'phone', 'sms', 'wifi', 'vcard', 'location', 'event', 'social', 'crypto', 'file', 'app'])
const TelegramMethodSchema = z.enum([
    'getMe',
    'getUpdates',
    'setWebhook',
    'deleteWebhook',
    'getWebhookInfo',
    'sendMessage',
    'sendPhoto',
    'sendDocument',
    'sendChatAction',
    'customMethod',
])
const TelegramParseModeSchema = z.enum(['none', 'HTML', 'MarkdownV2', 'Markdown'])
const TelegramChatActionSchema = z.enum([
    'typing',
    'upload_photo',
    'record_video',
    'upload_video',
    'record_voice',
    'upload_voice',
    'upload_document',
    'choose_sticker',
    'find_location',
    'record_video_note',
    'upload_video_note',
])
const ZaloBotMethodSchema = z.enum([
    'getMe',
    'getUpdates',
    'setWebhook',
    'deleteWebhook',
    'getWebhookInfo',
    'sendMessage',
    'sendPhoto',
    'sendSticker',
    'sendChatAction',
    'customMethod',
])
const ZaloChatActionSchema = z.enum(['typing', 'upload_photo'])

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
    endpoint: z.string().trim().min(1, 'AI endpoint không được để trống.').max(2048),
    apiKey: z.string().trim().min(1, 'AI API key không được để trống.').max(4096),
    model: z.string().trim().min(1, 'AI model không được để trống.').max(200),
    system: z.string().trim().max(3000).optional().default('You are a helpful automation agent.'),
    prompt: z.string().trim().min(1, 'Prompt không được để trống.').max(20_000),
    headers: JsonTextSchema.optional().default('{}'),
    extraBody: JsonTextSchema.optional().default('{}'),
    responsePath: z.string().trim().max(200).optional().default('choices.0.message.content'),
    temperature: z.coerce.number().min(0).max(2).default(0.35),
    maxTokens: z.coerce.number().int().min(64).max(8000).default(1200),
    timeoutMs: z.coerce.number().int().min(1000).max(120_000).default(60_000),
    outputKey: z.string().trim().max(80).optional().default('text'),
})

export const FlashcardGeneratorConfigSchema = z.object({
    topic: z.string().trim().min(3, 'Chủ đề quá ngắn.').max(1000),
    count: z.coerce.number().int().min(1).max(50).default(12),
    difficulty: z.string().trim().max(80).optional().default('trung bình'),
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

export const TelegramBotConfigSchema = z.object({
    botToken: z.string().trim().min(1, 'Telegram bot token không được để trống.').max(512),
    method: TelegramMethodSchema.default('sendMessage'),
    customMethod: z.string().trim().max(80).optional().default('').refine(value => !value || /^[A-Za-z][A-Za-z0-9_]{1,80}$/.test(value), 'Custom method không hợp lệ.'),
    chatId: z.string().trim().max(200).optional().default(''),
    text: z.string().trim().max(4096).optional().default(''),
    parseMode: TelegramParseModeSchema.default('none'),
    mediaUrl: z.string().trim().max(4096).optional().default(''),
    caption: z.string().trim().max(1024).optional().default(''),
    chatAction: TelegramChatActionSchema.default('typing'),
    webhookUrl: z.string().trim().max(2048).optional().default(''),
    secretToken: z.string().trim().max(256).optional().default(''),
    payload: JsonTextSchema.optional().default('{}'),
    timeoutMs: z.coerce.number().int().min(1000).max(120_000).default(30_000),
})

export const ZaloBotConfigSchema = z.object({
    botToken: z.string().trim().min(1, 'Zalo Bot token không được để trống.').max(512),
    method: ZaloBotMethodSchema.default('sendMessage'),
    customMethod: z.string().trim().max(80).optional().default('').refine(value => !value || /^[A-Za-z][A-Za-z0-9_]{1,80}$/.test(value), 'Custom method không hợp lệ.'),
    chatId: z.string().trim().max(200).optional().default(''),
    text: z.string().trim().max(2000).optional().default(''),
    photoUrl: z.string().trim().max(4096).optional().default(''),
    caption: z.string().trim().max(2000).optional().default(''),
    sticker: z.string().trim().max(4096).optional().default(''),
    chatAction: ZaloChatActionSchema.default('typing'),
    webhookUrl: z.string().trim().max(2048).optional().default(''),
    secretToken: z.string().trim().max(256).optional().default(''),
    payload: JsonTextSchema.optional().default('{}'),
    timeoutMs: z.coerce.number().int().min(1000).max(120_000).default(30_000),
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
    | typeof TelegramBotConfigSchema
    | typeof ZaloBotConfigSchema

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
        description: 'Gọi AI API riêng của node bằng endpoint, model và API key tự cấu hình.',
        category: 'Action',
        defaultConfig: {
            endpoint: 'https://api.openai.com/v1/chat/completions',
            apiKey: '{{input.aiApiKey}}',
            model: 'gpt-4o-mini',
            system: 'You are a helpful automation agent.',
            prompt: 'Summarize this input: {{input.text}}',
            headers: '{}',
            extraBody: '{}',
            responsePath: 'choices.0.message.content',
            temperature: 0.35,
            maxTokens: 1200,
            timeoutMs: 60_000,
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
            difficulty: 'trung bình',
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
    {
        type: 'telegramBot',
        label: 'Telegram Bot',
        description: 'Gọi Telegram Bot API qua HTTPS: sendMessage, sendPhoto, webhook, getUpdates hoặc custom method.',
        category: 'Action',
        defaultConfig: {
            botToken: '{{input.telegramBotToken}}',
            method: 'sendMessage',
            customMethod: '',
            chatId: '{{input.telegramChatId}}',
            text: 'Hello from Allinone Flow: {{input.text}}',
            parseMode: 'none',
            mediaUrl: '',
            caption: '',
            chatAction: 'typing',
            webhookUrl: '',
            secretToken: '',
            payload: '{}',
            timeoutMs: 30_000,
        },
        configSchema: TelegramBotConfigSchema,
    },
    {
        type: 'zaloBot',
        label: 'Zalo Bot',
        description: 'Gọi Zalo Bot Platform API từ bot.zapps.me: sendMessage, sendPhoto, sticker, webhook hoặc custom method.',
        category: 'Action',
        defaultConfig: {
            botToken: '{{input.zaloBotToken}}',
            method: 'sendMessage',
            customMethod: '',
            chatId: '{{input.zaloChatId}}',
            text: 'Xin chào từ Allinone Flow: {{input.text}}',
            photoUrl: '',
            caption: '',
            sticker: '',
            chatAction: 'typing',
            webhookUrl: '',
            secretToken: '',
            payload: '{}',
            timeoutMs: 30_000,
        },
        configSchema: ZaloBotConfigSchema,
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
