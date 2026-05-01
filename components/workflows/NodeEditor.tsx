'use client'

import { Copy, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { getWorkflowNodeDefinition, validateWorkflowNodeData } from '@/lib/workflows/registry'
import type { WorkflowCanvasNode, WorkflowNodeType } from '@/types/workflow'
import { useWorkflowStore } from '@/components/workflows/store/useWorkflowStore'

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'password'

interface FieldDefinition {
    key: string
    label: string
    type: FieldType
    placeholder?: string
    helpText?: string
    options?: { label: string; value: string }[]
    snippets?: { label: string; value: string }[]
    showWhen?: (config: WorkflowCanvasNode['data']['config']) => boolean
}

interface NodeConfigPreset {
    label: string
    description: string
    config: Record<string, unknown>
    nodeLabel?: string
}

interface TemplateSnippet {
    label: string
    value: string
    description: string
}

const methodIs = (...methods: string[]) => (config: WorkflowCanvasNode['data']['config']) => methods.includes(String(config.method || ''))

const commonTemplateSnippets: TemplateSnippet[] = [
    { label: 'input', value: '{{input}}', description: 'Toàn bộ manual input JSON.' },
    { label: 'input.message', value: '{{input.message}}', description: 'Tin nhắn người dùng hoặc chat input.' },
    { label: 'input.topic', value: '{{input.topic}}', description: 'Chủ đề dùng cho AI/flashcard.' },
    { label: 'now()', value: '{{now()}}', description: 'Thời gian hiện tại dạng ISO.' },
    { label: 'today()', value: '{{today()}}', description: 'Ngày hiện tại dạng YYYY-MM-DD.' },
    { label: 'upper()', value: '{{upper(input.message)}}', description: 'Viết hoa giá trị.' },
    { label: 'lower()', value: '{{lower(input.message)}}', description: 'Viết thường giá trị.' },
    { label: 'trim()', value: '{{trim(input.message)}}', description: 'Cắt khoảng trắng đầu/cuối.' },
    { label: 'urlEncode()', value: '{{urlEncode(input.query)}}', description: 'Encode query/path cho URL.' },
    { label: 'json()', value: '{{json(input.payload)}}', description: 'Serialize object để đưa vào JSON body.' },
]

const outputHintsByNodeType: Partial<Record<WorkflowNodeType, TemplateSnippet[]>> = {
    trigger: [
        { label: 'Trigger input', value: '{{nodes.{nodeId}.input}}', description: 'Manual input thực tế khi chạy flow.' },
        { label: 'Sample payload', value: '{{nodes.{nodeId}.samplePayload}}', description: 'Sample payload cấu hình trong trigger.' },
    ],
    httpRequest: [
        { label: 'HTTP status', value: '{{nodes.{nodeId}.status}}', description: 'Mã HTTP response.' },
        { label: 'HTTP body', value: '{{nodes.{nodeId}.body}}', description: 'Response body đã parse nếu là JSON.' },
    ],
    aiAgent: [
        { label: 'AI text', value: '{{nodes.{nodeId}.text}}', description: 'Text output mặc định của AI.' },
        { label: 'AI custom output', value: '{{nodes.{nodeId}.answer}}', description: 'Thay answer bằng outputKey của node AI.' },
    ],
    flashcardGenerator: [
        { label: 'Cards', value: '{{nodes.{nodeId}.cards}}', description: 'Danh sách flashcard đã tạo.' },
        { label: 'Inserted count', value: '{{nodes.{nodeId}.insertedCount}}', description: 'Số card đã insert vào set.' },
    ],
    qrGenerator: [
        { label: 'QR payload', value: '{{nodes.{nodeId}.payload}}', description: 'Payload QR đã sinh.' },
    ],
    supabaseQuery: [
        { label: 'Rows', value: '{{nodes.{nodeId}.data}}', description: 'Rows trả về từ Supabase.' },
    ],
    telegramBot: [
        { label: 'Telegram response', value: '{{nodes.{nodeId}.result}}', description: 'Response từ Telegram Bot API.' },
    ],
    zaloBot: [
        { label: 'Zalo response', value: '{{nodes.{nodeId}.result}}', description: 'Response từ Zalo Bot API.' },
    ],
    loop: [
        { label: 'Loop items', value: '{{nodes.{nodeId}.items}}', description: 'Danh sách item được chuẩn bị cho loop.' },
    ],
    condition: [
        { label: 'Condition branch', value: '{{nodes.{nodeId}.branch}}', description: 'true/false sau khi evaluate điều kiện.' },
    ],
}

const nodePresetsByType: Partial<Record<WorkflowNodeType, NodeConfigPreset[]>> = {
    trigger: [
        {
            label: 'Chat input sample',
            description: 'Manual input mẫu cho flow dạng chat.',
            config: { mode: 'manual', samplePayload: '{\n  "message": "Tóm tắt nội dung này",\n  "topic": "React hooks",\n  "telegramChatId": "123456789"\n}' },
        },
    ],
    aiAgent: [
        {
            label: 'Chat assistant',
            description: 'Prompt AI nhận input.message và trả lời ngắn gọn.',
            nodeLabel: 'AI Chat Assistant',
            config: {
                system: 'You are a concise Vietnamese assistant.',
                prompt: 'Trả lời người dùng bằng tiếng Việt.\n\nUser: {{input.message}}',
                outputKey: 'answer',
            },
        },
        {
            label: 'Summarizer',
            description: 'Tóm tắt text từ input.text.',
            nodeLabel: 'AI Summarizer',
            config: {
                system: 'You summarize content clearly in Vietnamese.',
                prompt: 'Tóm tắt nội dung sau thành 5 ý chính:\n\n{{input.text}}',
                outputKey: 'summary',
            },
        },
    ],
    httpRequest: [
        {
            label: 'POST JSON API',
            description: 'Body JSON có input.message và today().',
            config: {
                method: 'POST',
                headers: '{"Content-Type":"application/json","Authorization":"Bearer {{input.apiToken}}"}',
                body: '{"message":"{{input.message}}","date":"{{today()}}"}',
            },
        },
    ],
    telegramBot: [
        {
            label: 'Send message',
            description: 'Gửi input.message tới chatId.',
            config: { method: 'sendMessage', chatId: '{{input.telegramChatId}}', text: '{{input.message}}' },
        },
    ],
    zaloBot: [
        {
            label: 'Send message',
            description: 'Gửi input.message tới Zalo chatId.',
            config: { method: 'sendMessage', chatId: '{{input.zaloChatId}}', text: '{{input.message}}' },
        },
    ],
    flashcardGenerator: [
        {
            label: 'Quiz-style cards',
            description: 'Tạo flashcard bằng thuật toán quiz.',
            config: { topic: '{{input.topic}}', count: 12, difficulty: 'trung bình', notes: 'Mỗi card là một câu hỏi rõ ràng, có đáp án và giải thích ngắn.' },
        },
    ],
}

const fieldsByNodeType: Record<WorkflowNodeType, FieldDefinition[]> = {
    trigger: [
        { key: 'mode', label: 'Mode', type: 'select', options: ['manual', 'schedule', 'webhook'].map(value => ({ label: value, value })) },
        {
            key: 'samplePayload',
            label: 'Sample payload JSON',
            type: 'textarea',
            placeholder: '{"message":"hello"}',
            helpText: 'Dùng làm input mẫu khi thiết kế flow hoặc test manual run.',
            snippets: [
                { label: 'Chat', value: '{\n  "message": "Xin chào, hãy tóm tắt nội dung này",\n  "topic": "React hooks"\n}' },
                { label: 'Bot', value: '{\n  "message": "Gửi thông báo hôm nay",\n  "telegramChatId": "123456789",\n  "zaloChatId": "123456789"\n}' },
            ],
        },
    ],
    httpRequest: [
        { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(value => ({ label: value, value })) },
        { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/{{input.id}}', snippets: [{ label: 'Search API', value: 'https://api.example.com/search?q={{urlEncode(input.query)}}' }] },
        { key: 'headers', label: 'Headers JSON', type: 'textarea', placeholder: '{"Authorization":"Bearer ..."}', snippets: [{ label: 'Bearer JSON', value: '{"Content-Type":"application/json","Authorization":"Bearer {{input.apiToken}}"}' }] },
        { key: 'body', label: 'Body', type: 'textarea', placeholder: '{"message":"{{input.message}}"}', snippets: [{ label: 'Chat body', value: '{"message":"{{input.message}}","createdAt":"{{now()}}"}' }, { label: 'Payload', value: '{{json(input.payload)}}' }] },
        { key: 'timeoutMs', label: 'Timeout (ms)', type: 'number' },
        { key: 'failOnError', label: 'Fail on non-2xx', type: 'switch' },
    ],
    aiAgent: [
        { key: 'endpoint', label: 'AI endpoint', type: 'text', placeholder: 'https://api.openai.com/v1/chat/completions' },
        { key: 'apiKey', label: 'API key', type: 'password', placeholder: '{{input.aiApiKey}} hoặc sk-...' },
        { key: 'model', label: 'Model', type: 'text', placeholder: 'gpt-4o-mini' },
        { key: 'system', label: 'System prompt', type: 'textarea', snippets: [{ label: 'Vietnamese assistant', value: 'You are a concise Vietnamese assistant.' }, { label: 'Summarizer', value: 'You summarize content clearly in Vietnamese.' }] },
        { key: 'prompt', label: 'User prompt', type: 'textarea', placeholder: 'Summarize: {{input.text}}', snippets: [{ label: 'Chat', value: 'Trả lời người dùng bằng tiếng Việt.\n\nUser: {{input.message}}' }, { label: 'Summarize', value: 'Tóm tắt nội dung sau thành 5 ý chính:\n\n{{input.text}}' }, { label: 'Classify', value: 'Phân loại yêu cầu sau thành support/sales/other và giải thích ngắn:\n\n{{input.message}}' }] },
        { key: 'headers', label: 'Extra headers JSON', type: 'textarea', placeholder: '{"HTTP-Referer":"https://your-app.com"}' },
        { key: 'extraBody', label: 'Extra body JSON', type: 'textarea', placeholder: '{"top_p":0.9}' },
        { key: 'responsePath', label: 'Response path', type: 'text', placeholder: 'choices.0.message.content' },
        { key: 'temperature', label: 'Temperature', type: 'number' },
        { key: 'maxTokens', label: 'Max tokens', type: 'number' },
        { key: 'timeoutMs', label: 'Timeout (ms)', type: 'number' },
        { key: 'outputKey', label: 'Output key', type: 'text' },
    ],
    condition: [
        { key: 'left', label: 'Left value/template', type: 'text', placeholder: '{{input.status}}', snippets: [{ label: 'input.status', value: '{{input.status}}' }, { label: 'AI text', value: '{{nodes.aiAgent-1.text}}' }] },
        { key: 'operator', label: 'Operator', type: 'select', options: ['equals', 'notEquals', 'contains', 'exists', 'greaterThan', 'lessThan'].map(value => ({ label: value, value })) },
        { key: 'right', label: 'Right value/template', type: 'text', placeholder: 'approved' },
    ],
    loop: [
        { key: 'itemsPath', label: 'Items path', type: 'text', placeholder: 'input.items' },
        { key: 'maxIterations', label: 'Max iterations', type: 'number' },
    ],
    flashcardGenerator: [
        { key: 'topic', label: 'Topic', type: 'textarea', snippets: [{ label: 'input.topic', value: '{{input.topic}}' }, { label: 'Message', value: '{{input.message}}' }] },
        { key: 'count', label: 'Count', type: 'number' },
        { key: 'difficulty', label: 'Difficulty', type: 'text', placeholder: 'trung bình' },
        { key: 'language', label: 'Language', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'textarea', snippets: [{ label: 'Quiz style', value: 'Tạo flashcard bằng logic quiz: câu hỏi rõ ràng, đáp án đúng và giải thích ngắn.' }] },
        { key: 'setId', label: 'Flashcard set ID (optional)', type: 'text' },
        { key: 'modelDbId', label: 'AI model DB ID (optional)', type: 'text' },
    ],
    qrGenerator: [
        { key: 'type', label: 'QR type', type: 'select', options: ['url', 'text', 'email', 'phone', 'sms', 'wifi', 'vcard', 'location', 'event', 'social', 'crypto', 'file', 'app'].map(value => ({ label: value, value })) },
        { key: 'content', label: 'Content', type: 'textarea', snippets: [{ label: 'URL', value: '{{input.url}}' }, { label: 'AI text', value: '{{nodes.aiAgent-1.text}}' }] },
        { key: 'foreground', label: 'Foreground', type: 'text', placeholder: '#111827' },
        { key: 'background', label: 'Background', type: 'text', placeholder: '#ffffff' },
        { key: 'size', label: 'Size', type: 'number' },
    ],
    supabaseQuery: [
        { key: 'table', label: 'Table', type: 'text', placeholder: 'flashcard_sets' },
        { key: 'operation', label: 'Operation', type: 'select', options: ['select', 'insert', 'update', 'delete'].map(value => ({ label: value, value })) },
        { key: 'columns', label: 'Columns', type: 'text', placeholder: '*' },
        { key: 'filters', label: 'Filters JSON', type: 'textarea', placeholder: '{"id":"{{input.id}}"}', snippets: [{ label: 'By ID', value: '{"id":"{{input.id}}"}' }, { label: 'Owner', value: '{"user_id":"{{input.userId}}"}' }] },
        { key: 'payload', label: 'Payload JSON', type: 'textarea', placeholder: '{"title":"New"}', snippets: [{ label: 'Title', value: '{"title":"{{input.title}}","updated_at":"{{now()}}"}' }] },
        { key: 'limit', label: 'Limit', type: 'number' },
    ],
    telegramBot: [
        { key: 'botToken', label: 'Bot token', type: 'password', placeholder: '123456:ABC hoặc {{input.telegramBotToken}}' },
        { key: 'method', label: 'Method', type: 'select', options: ['getMe', 'getUpdates', 'setWebhook', 'deleteWebhook', 'getWebhookInfo', 'sendMessage', 'sendPhoto', 'sendDocument', 'sendChatAction', 'customMethod'].map(value => ({ label: value, value })) },
        { key: 'customMethod', label: 'Custom method', type: 'text', placeholder: 'answerCallbackQuery', showWhen: methodIs('customMethod') },
        { key: 'chatId', label: 'Chat ID', type: 'text', placeholder: '@channel_username hoặc {{input.chatId}}', showWhen: methodIs('sendMessage', 'sendPhoto', 'sendDocument', 'sendChatAction') },
        { key: 'text', label: 'Text', type: 'textarea', placeholder: 'Nội dung 1-4096 ký tự', snippets: [{ label: 'input.message', value: '{{input.message}}' }, { label: 'AI answer', value: '{{nodes.aiAgent-1.answer}}' }], showWhen: methodIs('sendMessage') },
        { key: 'parseMode', label: 'Parse mode', type: 'select', options: ['none', 'HTML', 'MarkdownV2', 'Markdown'].map(value => ({ label: value, value })), showWhen: methodIs('sendMessage', 'sendPhoto', 'sendDocument') },
        { key: 'mediaUrl', label: 'Media URL / file_id', type: 'text', placeholder: 'photo/document URL hoặc file_id', showWhen: methodIs('sendPhoto', 'sendDocument') },
        { key: 'caption', label: 'Caption', type: 'textarea', showWhen: methodIs('sendPhoto', 'sendDocument') },
        { key: 'chatAction', label: 'Chat action', type: 'select', options: ['typing', 'upload_photo', 'record_video', 'upload_video', 'record_voice', 'upload_voice', 'upload_document', 'choose_sticker', 'find_location', 'record_video_note', 'upload_video_note'].map(value => ({ label: value, value })), showWhen: methodIs('sendChatAction') },
        { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://example.com/api/webhook', showWhen: methodIs('setWebhook') },
        { key: 'secretToken', label: 'Webhook secret token', type: 'password', showWhen: methodIs('setWebhook') },
        { key: 'payload', label: 'Extra/custom payload JSON', type: 'textarea', placeholder: '{"disable_notification":true}' },
        { key: 'timeoutMs', label: 'Timeout (ms)', type: 'number' },
    ],
    zaloBot: [
        { key: 'botToken', label: 'Bot token', type: 'password', placeholder: '12345689:abc-xyz hoặc {{input.zaloBotToken}}' },
        { key: 'method', label: 'Method', type: 'select', options: ['getMe', 'getUpdates', 'setWebhook', 'deleteWebhook', 'getWebhookInfo', 'sendMessage', 'sendPhoto', 'sendSticker', 'sendChatAction', 'customMethod'].map(value => ({ label: value, value })) },
        { key: 'customMethod', label: 'Custom method', type: 'text', placeholder: 'futureApiName', showWhen: methodIs('customMethod') },
        { key: 'chatId', label: 'Chat ID', type: 'text', placeholder: '{{input.zaloChatId}}', showWhen: methodIs('sendMessage', 'sendPhoto', 'sendSticker', 'sendChatAction') },
        { key: 'text', label: 'Text', type: 'textarea', placeholder: 'Nội dung 1-2000 ký tự', snippets: [{ label: 'input.message', value: '{{input.message}}' }, { label: 'AI answer', value: '{{nodes.aiAgent-1.answer}}' }], showWhen: methodIs('sendMessage') },
        { key: 'photoUrl', label: 'Photo URL', type: 'text', showWhen: methodIs('sendPhoto') },
        { key: 'caption', label: 'Caption', type: 'textarea', showWhen: methodIs('sendPhoto') },
        { key: 'sticker', label: 'Sticker', type: 'text', placeholder: 'Sticker id/url từ stickers.zaloapp.com', showWhen: methodIs('sendSticker') },
        { key: 'chatAction', label: 'Chat action', type: 'select', options: ['typing', 'upload_photo'].map(value => ({ label: value, value })), showWhen: methodIs('sendChatAction') },
        { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://example.com/api/zalo-webhook', showWhen: methodIs('setWebhook') },
        { key: 'secretToken', label: 'Webhook secret token', type: 'password', showWhen: methodIs('setWebhook') },
        { key: 'payload', label: 'Extra/custom payload JSON', type: 'textarea', placeholder: '{"timeout":"30"}' },
        { key: 'timeoutMs', label: 'Timeout (ms)', type: 'number' },
    ],
}

function FieldEditor({ node, field }: { node: WorkflowCanvasNode; field: FieldDefinition }) {
    const updateNodeConfig = useWorkflowStore(state => state.updateNodeConfig)
    const value = node.data.config[field.key]
    const id = `${node.id}-${field.key}`
    const snippets = field.snippets || []

    const helper = (
        <>
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {snippets.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {snippets.map(snippet => (
                        <Button
                            key={`${field.key}-${snippet.label}`}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => updateNodeConfig(node.id, field.key, snippet.value)}
                        >
                            {snippet.label}
                        </Button>
                    ))}
                </div>
            )}
        </>
    )

    if (field.type === 'select') {
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Select value={String(value ?? '')} onValueChange={(nextValue) => updateNodeConfig(node.id, field.key, nextValue)}>
                    <SelectTrigger id={id} className="bg-background">
                        <SelectValue placeholder={field.placeholder || field.label} />
                    </SelectTrigger>
                    <SelectContent>
                        {(field.options || []).map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {helper}
            </div>
        )
    }

    if (field.type === 'switch') {
        return (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                <Label htmlFor={id}>{field.label}</Label>
                <Switch id={id} checked={Boolean(value)} onCheckedChange={(checked) => updateNodeConfig(node.id, field.key, checked)} />
            </div>
        )
    }

    if (field.type === 'textarea') {
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Textarea
                    id={id}
                    value={String(value ?? '')}
                    onChange={(event) => updateNodeConfig(node.id, field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="max-h-72 min-h-24 resize-y overflow-y-auto bg-background font-mono text-xs"
                />
                {helper}
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{field.label}</Label>
            <Input
                id={id}
                type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
                value={String(value ?? '')}
                onChange={(event) => updateNodeConfig(node.id, field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)}
                placeholder={field.placeholder}
                className="bg-background"
            />
            {helper}
        </div>
    )
}

function copyTemplate(value: string) {
    if (!navigator.clipboard) {
        toast.error('Trình duyệt không hỗ trợ copy clipboard.')
        return
    }

    void navigator.clipboard
        .writeText(value)
        .then(() => toast.success('Đã copy template.'))
        .catch(() => toast.error('Không thể copy template.'))
}

function TemplateButton({ snippet }: { snippet: TemplateSnippet }) {
    return (
        <button
            type="button"
            onClick={() => copyTemplate(snippet.value)}
            className="group rounded-lg border bg-background p-2 text-left transition-colors hover:bg-muted/70"
        >
            <div className="flex items-start justify-between gap-2">
                <code className="break-all rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground">{snippet.value}</code>
                <Copy className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{snippet.description}</p>
        </button>
    )
}

function NodePresetActions({ node }: { node: WorkflowCanvasNode }) {
    const updateNodeData = useWorkflowStore(state => state.updateNodeData)
    const updateNodeConfig = useWorkflowStore(state => state.updateNodeConfig)
    const presets = nodePresetsByType[node.data.nodeType] || []

    if (presets.length === 0) return null

    return (
        <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="size-3.5" />
                Mẫu node có sẵn
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {presets.map(preset => (
                    <Button
                        key={preset.label}
                        type="button"
                        variant="outline"
                        className="h-auto justify-start whitespace-normal p-2 text-left"
                        onClick={() => {
                            if (preset.nodeLabel) updateNodeData(node.id, { label: preset.nodeLabel })
                            Object.entries(preset.config).forEach(([key, value]) => updateNodeConfig(node.id, key, value))
                            toast.success(`Đã áp dụng mẫu ${preset.label}.`)
                        }}
                    >
                        <span className="min-w-0 space-y-0.5">
                            <span className="block truncate text-xs font-medium">{preset.label}</span>
                            <span className="line-clamp-2 text-[11px] font-normal text-muted-foreground">{preset.description}</span>
                        </span>
                    </Button>
                ))}
            </div>
        </div>
    )
}

function ExpressionReference({ node, nodes }: { node: WorkflowCanvasNode; nodes: WorkflowCanvasNode[] }) {
    const currentNodeOutputs = outputHintsByNodeType[node.data.nodeType] || []
    const otherNodeOutputs = nodes
        .filter(item => item.id !== node.id)
        .flatMap(item => (outputHintsByNodeType[item.data.nodeType] || []).map(snippet => ({
            ...snippet,
            label: `${item.data.label}: ${snippet.label}`,
            value: snippet.value.replace('{nodeId}', item.id),
        })))

    return (
        <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Biến và hàm có sẵn</p>
                    <p className="text-xs text-muted-foreground">Click để copy, dùng trong field dạng <code>{'{{...}}'}</code>.</p>
                </div>
                <Badge variant="outline">n8n-style</Badge>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                {commonTemplateSnippets.map(snippet => <TemplateButton key={snippet.label} snippet={snippet} />)}
            </div>

            {otherNodeOutputs.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Output từ node khác</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {otherNodeOutputs.slice(0, 8).map(snippet => <TemplateButton key={`${snippet.label}-${snippet.value}`} snippet={snippet} />)}
                    </div>
                </div>
            )}

            {currentNodeOutputs.length > 0 && (
                <div className="space-y-1 rounded-lg border bg-background p-2 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Node này sẽ output:</p>
                    {currentNodeOutputs.map(snippet => (
                        <div key={snippet.label} className="flex items-start gap-2">
                            <span className="mt-1 size-1.5 rounded-full bg-primary" />
                            <span>{snippet.label}: {snippet.description}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export function NodeEditor() {
    const selectedNodeId = useWorkflowStore(state => state.selectedNodeId)
    const nodes = useWorkflowStore(state => state.nodes)
    const updateNodeData = useWorkflowStore(state => state.updateNodeData)
    const deleteNode = useWorkflowStore(state => state.deleteNode)
    const node = nodes.find(item => item.id === selectedNodeId)

    if (!node) {
        return (
            <Card className="flex h-full min-h-0 flex-1 overflow-hidden py-0">
                <ScrollArea className="min-h-0 flex-1">
                    <CardContent className="space-y-4 p-4 text-sm text-muted-foreground">
                        <div className="rounded-xl border border-dashed bg-muted/20 p-4">
                            <p className="font-medium text-foreground">Chọn một node trên canvas để chỉnh cấu hình.</p>
                            <p className="mt-2">Dùng template như <code className="rounded bg-muted px-1">{'{{input.message}}'}</code>, <code className="rounded bg-muted px-1">{'{{nodes.nodeId.text}}'}</code> hoặc helper <code className="rounded bg-muted px-1">{'{{today()}}'}</code>.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide">Input mẫu phổ biến</p>
                            {commonTemplateSnippets.slice(0, 5).map(snippet => <TemplateButton key={snippet.label} snippet={snippet} />)}
                        </div>
                    </CardContent>
                </ScrollArea>
            </Card>
        )
    }

    const definition = getWorkflowNodeDefinition(node.data.nodeType)
    const validation = validateWorkflowNodeData(node.data)

    return (
        <Card className="flex h-full min-h-0 flex-1 overflow-hidden py-0">
            <CardHeader className="shrink-0 space-y-3 border-b p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Node Editor</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base">{definition.label}</CardTitle>
                            <Badge variant="secondary">{definition.category}</Badge>
                        </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => deleteNode(node.id)}>
                        <Trash2 className="size-4" />
                        <span className="sr-only">Xóa node</span>
                    </Button>
                </div>
                {!validation.success && (
                    <Alert variant="destructive" className="py-2 text-xs">
                        <AlertDescription>{validation.error.issues[0].message}</AlertDescription>
                    </Alert>
                )}
            </CardHeader>

            <ScrollArea className="min-h-0 flex-1">
                <CardContent className="space-y-5 p-4">
                    <div className="space-y-2">
                        <Label htmlFor="node-label">Label</Label>
                        <Input
                            id="node-label"
                            value={node.data.label}
                            onChange={(event) => updateNodeData(node.id, { label: event.target.value })}
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="node-description">Description</Label>
                        <Textarea
                            id="node-description"
                            value={node.data.description || ''}
                            onChange={(event) => updateNodeData(node.id, { description: event.target.value })}
                            className="min-h-20 bg-background"
                        />
                    </div>

                    <Separator />

                    <NodePresetActions node={node} />
                    <ExpressionReference node={node} nodes={nodes} />

                    <Separator />

                    {fieldsByNodeType[node.data.nodeType].filter(field => !field.showWhen || field.showWhen(node.data.config)).map(field => (
                        <FieldEditor key={field.key} node={node} field={field} />
                    ))}
                </CardContent>
            </ScrollArea>
        </Card>
    )
}
