/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { generateJson } from '@/lib/ai/service'
import { buildQrPayload, createDefaultQrForm, mergeQrDesign, type QrFormValues, type QrType } from '@/lib/qr-code'
import type { Database } from '@/types/database'
import type {
    JsonRecord,
    WorkflowCanvasEdge,
    WorkflowCanvasNode,
    WorkflowExecutionLogRecord,
    WorkflowLogLevel,
    WorkflowRecord,
} from '@/types/workflow'
import {
    AiAgentConfigSchema,
    ConditionConfigSchema,
    FlashcardGeneratorConfigSchema,
    HttpRequestConfigSchema,
    LoopConfigSchema,
    QrGeneratorConfigSchema,
    SupabaseQueryConfigSchema,
    TelegramBotConfigSchema,
    TriggerConfigSchema,
    ZaloBotConfigSchema,
} from '@/lib/workflows/registry'

type WorkflowSupabaseClient = SupabaseClient<Database>

interface ExecuteWorkflowParams {
    supabase: WorkflowSupabaseClient
    workflow: WorkflowRecord
    executionId: string
    userId: string
    input: JsonRecord
}

interface RuntimeContext {
    supabase: WorkflowSupabaseClient
    workflow: WorkflowRecord
    executionId: string
    userId: string
    input: JsonRecord
    outputs: Record<string, unknown>
    logs: WorkflowExecutionLogRecord[]
}

const GeneratedFlashcardsSchema = z.object({
    cards: z.array(z.object({
        term: z.string().trim().min(1).max(500),
        definition: z.string().trim().min(1).max(5000),
    })).min(1).max(50),
})

function nowIso() {
    return new Date().toISOString()
}

function isRecord(value: unknown): value is JsonRecord {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getPath(source: unknown, path: string): unknown {
    const parts = path.split('.').filter(Boolean)
    let current = source

    for (const part of parts) {
        if (Array.isArray(current)) {
            const index = Number(part)
            if (!Number.isInteger(index) || index < 0 || index >= current.length) return undefined
            current = current[index]
            continue
        }

        if (!isRecord(current)) return undefined
        current = current[part]
    }

    return current
}

function stringifyTemplateValue(value: unknown) {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    return JSON.stringify(value)
}

function resolveTemplate(template: string, context: RuntimeContext) {
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, expression: string) => {
        const path = expression.trim()

        if (path.startsWith('input.')) return stringifyTemplateValue(getPath(context.input, path.slice(6)))
        if (path === 'input') return stringifyTemplateValue(context.input)
        if (path.startsWith('nodes.')) return stringifyTemplateValue(getPath(context.outputs, path.slice(6)))

        return stringifyTemplateValue(getPath({ input: context.input, nodes: context.outputs }, path))
    })
}

function parseJsonObject(value: string, context: RuntimeContext, label: string) {
    const resolved = resolveTemplate(value || '{}', context).trim()
    if (!resolved) return {}

    const parsed = JSON.parse(resolved) as unknown
    if (!isRecord(parsed)) throw new Error(`${label} phải là JSON object.`)
    return parsed
}

function parseMaybeJson(text: string) {
    if (!text) return null
    try {
        return JSON.parse(text) as unknown
    } catch {
        return text
    }
}

function compactPayload(payload: JsonRecord) {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
    )
}

function assertRequired(value: string, message: string) {
    if (!value.trim()) throw new Error(message)
    return value.trim()
}

function stringifyHeaderValues(headers: JsonRecord) {
    return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key, stringifyTemplateValue(value)]))
}

function extractAiResponseText(body: unknown, responsePath: string) {
    const candidates = [
        responsePath,
        'choices.0.message.content',
        'choices.0.text',
        'output_text',
        'output.0.content.0.text',
    ].filter(Boolean)

    for (const path of candidates) {
        const value = getPath(body, path)
        if (value !== undefined && value !== null) return stringifyTemplateValue(value)
    }

    return stringifyTemplateValue(body)
}

async function postBotApiJson(params: {
    url: string
    body: JsonRecord
    timeoutMs: number
    provider: 'telegram' | 'zalo'
    method: string
}) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), params.timeoutMs)

    try {
        const response = await fetch(params.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params.body),
            signal: controller.signal,
        })
        const responseText = await response.text()
        const body = parseMaybeJson(responseText)

        if (!response.ok) {
            throw new Error(`${params.provider} ${params.method} HTTP ${response.status}: ${responseText.slice(0, 500)}`)
        }

        if (isRecord(body) && body.ok === false) {
            const description = typeof body.description === 'string' ? body.description : 'Bot API returned ok=false.'
            throw new Error(`${params.provider} ${params.method}: ${description}`)
        }

        return {
            provider: params.provider,
            method: params.method,
            status: response.status,
            ok: isRecord(body) && typeof body.ok === 'boolean' ? body.ok : response.ok,
            result: isRecord(body) ? body.result : body,
            description: isRecord(body) ? body.description : undefined,
            errorCode: isRecord(body) ? body.error_code : undefined,
        }
    } finally {
        clearTimeout(timeout)
    }
}

async function writeLog(
    context: RuntimeContext,
    level: WorkflowLogLevel,
    message: string,
    nodeId?: string | null,
    payload?: JsonRecord | null
) {
    const optimisticLog: WorkflowExecutionLogRecord = {
        id: crypto.randomUUID(),
        execution_id: context.executionId,
        workflow_id: context.workflow.id,
        user_id: context.userId,
        node_id: nodeId || null,
        level,
        message,
        payload: payload || null,
        created_at: nowIso(),
    }

    context.logs.push(optimisticLog)

    const db = context.supabase as any
    await db.from('workflow_execution_logs').insert({
        execution_id: context.executionId,
        workflow_id: context.workflow.id,
        user_id: context.userId,
        node_id: nodeId || null,
        level,
        message,
        payload: payload || null,
    })
}

async function executeTriggerNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    const config = TriggerConfigSchema.parse(node.data.config)
    const samplePayload = parseJsonObject(config.samplePayload || '{}', context, 'Sample payload')
    return {
        mode: config.mode,
        input: context.input,
        samplePayload,
    }
}

async function executeHttpRequestNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    const config = HttpRequestConfigSchema.parse(node.data.config)
    const headers = parseJsonObject(config.headers || '{}', context, 'Headers')
    const url = resolveTemplate(config.url, context)
    const body = resolveTemplate(config.body || '', context)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

    try {
        const response = await fetch(url, {
            method: config.method,
            headers: headers as HeadersInit,
            body: ['GET', 'DELETE'].includes(config.method) || !body ? undefined : body,
            signal: controller.signal,
        })

        const responseText = await response.text()
        const parsedBody = parseMaybeJson(responseText)

        if (!response.ok && config.failOnError) {
            throw new Error(`HTTP ${response.status}: ${responseText.slice(0, 500)}`)
        }

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: parsedBody,
        }
    } finally {
        clearTimeout(timeout)
    }
}

async function executeTelegramBotNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    const config = TelegramBotConfigSchema.parse(node.data.config)
    const token = assertRequired(resolveTemplate(config.botToken, context), 'Telegram bot token không được để trống.')
    const extraPayload = parseJsonObject(config.payload || '{}', context, 'Telegram payload')
    const method = config.method === 'customMethod'
        ? assertRequired(resolveTemplate(config.customMethod || '', context), 'Telegram custom method không được để trống.')
        : config.method
    let payload: JsonRecord = { ...extraPayload }

    if (method === 'sendMessage') {
        payload = compactPayload({
            ...payload,
            chat_id: assertRequired(resolveTemplate(config.chatId || '', context), 'Telegram chat_id không được để trống.'),
            text: assertRequired(resolveTemplate(config.text || '', context), 'Telegram text không được để trống.'),
            parse_mode: config.parseMode === 'none' ? undefined : config.parseMode,
        })
    } else if (method === 'sendPhoto') {
        payload = compactPayload({
            ...payload,
            chat_id: assertRequired(resolveTemplate(config.chatId || '', context), 'Telegram chat_id không được để trống.'),
            photo: assertRequired(resolveTemplate(config.mediaUrl || '', context), 'Telegram photo URL/file_id không được để trống.'),
            caption: resolveTemplate(config.caption || '', context),
            parse_mode: config.parseMode === 'none' ? undefined : config.parseMode,
        })
    } else if (method === 'sendDocument') {
        payload = compactPayload({
            ...payload,
            chat_id: assertRequired(resolveTemplate(config.chatId || '', context), 'Telegram chat_id không được để trống.'),
            document: assertRequired(resolveTemplate(config.mediaUrl || '', context), 'Telegram document URL/file_id không được để trống.'),
            caption: resolveTemplate(config.caption || '', context),
            parse_mode: config.parseMode === 'none' ? undefined : config.parseMode,
        })
    } else if (method === 'sendChatAction') {
        payload = compactPayload({
            ...payload,
            chat_id: assertRequired(resolveTemplate(config.chatId || '', context), 'Telegram chat_id không được để trống.'),
            action: config.chatAction,
        })
    } else if (method === 'setWebhook') {
        payload = compactPayload({
            ...payload,
            url: assertRequired(resolveTemplate(config.webhookUrl || '', context), 'Telegram webhook URL không được để trống.'),
            secret_token: resolveTemplate(config.secretToken || '', context),
        })
    }

    return postBotApiJson({
        url: `https://api.telegram.org/bot${token}/${method}`,
        body: payload,
        timeoutMs: config.timeoutMs,
        provider: 'telegram',
        method,
    })
}

async function executeZaloBotNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    const config = ZaloBotConfigSchema.parse(node.data.config)
    const token = assertRequired(resolveTemplate(config.botToken, context), 'Zalo Bot token không được để trống.')
    const extraPayload = parseJsonObject(config.payload || '{}', context, 'Zalo Bot payload')
    const method = config.method === 'customMethod'
        ? assertRequired(resolveTemplate(config.customMethod || '', context), 'Zalo Bot custom method không được để trống.')
        : config.method
    let payload: JsonRecord = { ...extraPayload }

    if (method === 'sendMessage') {
        payload = compactPayload({
            ...payload,
            chat_id: assertRequired(resolveTemplate(config.chatId || '', context), 'Zalo chat_id không được để trống.'),
            text: assertRequired(resolveTemplate(config.text || '', context), 'Zalo text không được để trống.'),
        })
    } else if (method === 'sendPhoto') {
        payload = compactPayload({
            ...payload,
            chat_id: assertRequired(resolveTemplate(config.chatId || '', context), 'Zalo chat_id không được để trống.'),
            photo: assertRequired(resolveTemplate(config.photoUrl || '', context), 'Zalo photo URL không được để trống.'),
            caption: resolveTemplate(config.caption || '', context),
        })
    } else if (method === 'sendSticker') {
        payload = compactPayload({
            ...payload,
            chat_id: assertRequired(resolveTemplate(config.chatId || '', context), 'Zalo chat_id không được để trống.'),
            sticker: assertRequired(resolveTemplate(config.sticker || '', context), 'Zalo sticker không được để trống.'),
        })
    } else if (method === 'sendChatAction') {
        payload = compactPayload({
            ...payload,
            chat_id: assertRequired(resolveTemplate(config.chatId || '', context), 'Zalo chat_id không được để trống.'),
            action: config.chatAction,
        })
    } else if (method === 'setWebhook') {
        payload = compactPayload({
            ...payload,
            url: assertRequired(resolveTemplate(config.webhookUrl || '', context), 'Zalo webhook URL không được để trống.'),
            secret_token: assertRequired(resolveTemplate(config.secretToken || '', context), 'Zalo webhook secret_token không được để trống.'),
        })
    }

    return postBotApiJson({
        url: `https://bot-api.zaloplatforms.com/bot${token}/${method}`,
        body: payload,
        timeoutMs: config.timeoutMs,
        provider: 'zalo',
        method,
    })
}

async function executeAiAgentNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    const config = AiAgentConfigSchema.parse(node.data.config)
    const endpoint = assertRequired(resolveTemplate(config.endpoint, context), 'AI endpoint không được để trống.')
    const apiKey = assertRequired(resolveTemplate(config.apiKey, context), 'AI API key không được để trống.')
    const model = assertRequired(resolveTemplate(config.model, context), 'AI model không được để trống.')
    const headers = stringifyHeaderValues(parseJsonObject(config.headers || '{}', context, 'AI headers'))
    const extraBody = parseJsonObject(config.extraBody || '{}', context, 'AI extra body')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                ...headers,
            },
            body: JSON.stringify(compactPayload({
                model,
                messages: [
                    { role: 'system', content: resolveTemplate(config.system || '', context) },
                    { role: 'user', content: resolveTemplate(config.prompt, context) },
                ],
                temperature: config.temperature,
                max_tokens: config.maxTokens,
                ...extraBody,
            })),
            signal: controller.signal,
        })
        const responseText = await response.text()
        const body = parseMaybeJson(responseText)

        if (!response.ok) {
            throw new Error(`AI API HTTP ${response.status}: ${responseText.slice(0, 500)}`)
        }

        const text = extractAiResponseText(body, config.responsePath || '')

        return {
            [config.outputKey || 'text']: text,
            text,
            model,
            endpoint,
            raw: body,
        }
    } finally {
        clearTimeout(timeout)
    }
}

async function executeFlashcardGeneratorNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    const config = FlashcardGeneratorConfigSchema.parse(node.data.config)
    const result = await generateJson<unknown>({
        featureKey: 'flow.flashcards.generate',
        userId: context.userId,
        modelDbId: config.modelDbId,
        system: 'You create accurate, concise flashcards. Return JSON only.',
        prompt: JSON.stringify({
            topic: resolveTemplate(config.topic, context),
            count: config.count,
            language: config.language || 'Vietnamese',
            notes: resolveTemplate(config.notes || '', context),
            outputShape: { cards: [{ term: 'string', definition: 'string' }] },
        }),
        maxTokens: Math.min(5000, 350 + config.count * 180),
        temperature: 0.35,
    })

    const cards = GeneratedFlashcardsSchema.parse(result).cards.slice(0, config.count)
    let insertedCount = 0

    if (config.setId) {
        const db = context.supabase as any
        const { data: set } = await db
            .from('flashcard_sets')
            .select('id')
            .eq('id', config.setId)
            .eq('user_id', context.userId)
            .single()

        if (!set) throw new Error('Không tìm thấy flashcard set thuộc user hiện tại.')

        const { data: lastCards } = await db
            .from('flashcards')
            .select('order_index')
            .eq('set_id', config.setId)
            .order('order_index', { ascending: false })
            .limit(1)

        const startOrder = (lastCards?.[0]?.order_index ?? -1) + 1
        const setId = config.setId
        const payload = cards.map((card, index) => ({
            set_id: setId,
            term: card.term,
            definition: card.definition,
            order_index: startOrder + index,
        }))

        const { error } = await db.from('flashcards').insert(payload)
        if (error) throw new Error(error.message)
        insertedCount = payload.length
    }

    return { cards, insertedCount }
}

function applyQrContent(type: QrType, content: string): QrFormValues {
    const form = createDefaultQrForm()

    if (type === 'url') form.url = content
    else if (type === 'email') form.email = { ...form.email, to: content }
    else if (type === 'phone') form.phone = content
    else if (type === 'sms') form.sms = { ...form.sms, message: content }
    else if (type === 'wifi') form.wifi = { ...form.wifi, ssid: content }
    else if (type === 'file') form.file = { url: content }
    else if (type === 'app') form.app = { ...form.app, value: content }
    else if (type === 'social') form.social = { ...form.social, value: content }
    else form.text = content

    return form
}

async function executeQrGeneratorNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    const config = QrGeneratorConfigSchema.parse(node.data.config)
    const content = resolveTemplate(config.content, context)
    const form = applyQrContent(config.type as QrType, content)
    const payloadResult = buildQrPayload(config.type as QrType, form)

    if (payloadResult.error) throw new Error(payloadResult.error)

    return {
        type: config.type,
        payload: payloadResult.payload,
        label: payloadResult.label,
        isUrlLike: payloadResult.isUrlLike,
        design: mergeQrDesign({
            foreground: config.foreground,
            background: config.background,
            size: config.size,
        }),
    }
}

function applyFilters(query: unknown, filters: JsonRecord) {
    let nextQuery = query as { eq: (column: string, value: unknown) => unknown }

    for (const [column, value] of Object.entries(filters)) {
        nextQuery = nextQuery.eq(column, value) as typeof nextQuery
    }

    return nextQuery
}

async function executeSupabaseQueryNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    const config = SupabaseQueryConfigSchema.parse(node.data.config)
    const filters = parseJsonObject(config.filters || '{}', context, 'Filters')
    const payload = parseJsonObject(config.payload || '{}', context, 'Payload')
    const db = context.supabase as unknown as {
        from: (table: string) => {
            select: (columns?: string) => unknown
            insert: (payload: JsonRecord | JsonRecord[]) => { select: () => { limit: (limit: number) => Promise<{ data: unknown; error: { message: string } | null }> } }
            update: (payload: JsonRecord) => unknown
            delete: () => unknown
        }
    }

    if (config.operation === 'select') {
        const query = applyFilters(db.from(config.table).select(config.columns || '*'), filters) as unknown as { limit: (limit: number) => Promise<{ data: unknown; error: { message: string } | null }> }
        const { data, error } = await query.limit(config.limit)
        if (error) throw new Error(error.message)
        return { data }
    }

    if (config.operation === 'insert') {
        const { data, error } = await db.from(config.table).insert(payload).select().limit(config.limit)
        if (error) throw new Error(error.message)
        return { data }
    }

    if (Object.keys(filters).length === 0) {
        throw new Error('Update/Delete cần filters để tránh thao tác toàn bảng.')
    }

    if (config.operation === 'update') {
        const query = applyFilters(db.from(config.table).update(payload), filters) as unknown as { select: () => { limit: (limit: number) => Promise<{ data: unknown; error: { message: string } | null }> } }
        const { data, error } = await query.select().limit(config.limit)
        if (error) throw new Error(error.message)
        return { data }
    }

    const query = applyFilters(db.from(config.table).delete(), filters) as unknown as { select: () => { limit: (limit: number) => Promise<{ data: unknown; error: { message: string } | null }> } }
    const { data, error } = await query.select().limit(config.limit)
    if (error) throw new Error(error.message)
    return { data }
}

function compareCondition(left: string, operator: string, right: string) {
    if (operator === 'exists') return left.trim().length > 0
    if (operator === 'contains') return left.includes(right)
    if (operator === 'notEquals') return left !== right
    if (operator === 'greaterThan') return Number(left) > Number(right)
    if (operator === 'lessThan') return Number(left) < Number(right)
    return left === right
}

async function executeConditionNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    const config = ConditionConfigSchema.parse(node.data.config)
    const left = resolveTemplate(config.left, context)
    const right = resolveTemplate(config.right || '', context)
    const branch = compareCondition(left, config.operator, right)

    return { branch, left, operator: config.operator, right }
}

async function executeLoopNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    const config = LoopConfigSchema.parse(node.data.config)
    const source = config.itemsPath.startsWith('input.')
        ? getPath(context.input, config.itemsPath.slice(6))
        : getPath({ input: context.input, nodes: context.outputs }, config.itemsPath)
    const items = Array.isArray(source) ? source.slice(0, config.maxIterations) : []

    return {
        items,
        count: items.length,
        truncated: Array.isArray(source) && source.length > items.length,
    }
}

async function executeNode(node: WorkflowCanvasNode, context: RuntimeContext) {
    if (node.data.nodeType === 'trigger') return executeTriggerNode(node, context)
    if (node.data.nodeType === 'httpRequest') return executeHttpRequestNode(node, context)
    if (node.data.nodeType === 'aiAgent') return executeAiAgentNode(node, context)
    if (node.data.nodeType === 'flashcardGenerator') return executeFlashcardGeneratorNode(node, context)
    if (node.data.nodeType === 'qrGenerator') return executeQrGeneratorNode(node, context)
    if (node.data.nodeType === 'supabaseQuery') return executeSupabaseQueryNode(node, context)
    if (node.data.nodeType === 'telegramBot') return executeTelegramBotNode(node, context)
    if (node.data.nodeType === 'zaloBot') return executeZaloBotNode(node, context)
    if (node.data.nodeType === 'condition') return executeConditionNode(node, context)
    if (node.data.nodeType === 'loop') return executeLoopNode(node, context)

    throw new Error(`Unsupported node type: ${node.data.nodeType}`)
}

function getStartNodes(nodes: WorkflowCanvasNode[], edges: WorkflowCanvasEdge[]) {
    const targets = new Set(edges.map(edge => edge.target))
    const triggerNodes = nodes.filter(node => node.data.nodeType === 'trigger')
    return triggerNodes.length > 0 ? triggerNodes : nodes.filter(node => !targets.has(node.id))
}

function getNextEdges(node: WorkflowCanvasNode, result: unknown, edges: WorkflowCanvasEdge[]) {
    const outgoing = edges.filter(edge => edge.source === node.id)

    if (node.data.nodeType !== 'condition') return outgoing

    const branch = isRecord(result) && result.branch === true ? 'true' : 'false'
    return outgoing.filter(edge => !edge.sourceHandle || edge.sourceHandle === branch)
}

export async function executeWorkflow(params: ExecuteWorkflowParams) {
    const startedAt = Date.now()
    const context: RuntimeContext = {
        supabase: params.supabase,
        workflow: params.workflow,
        executionId: params.executionId,
        userId: params.userId,
        input: params.input,
        outputs: {},
        logs: [],
    }

    await writeLog(context, 'info', `Bắt đầu chạy flow "${params.workflow.name}".`)

    try {
        const nodesById = new Map(params.workflow.definition.nodes.map(node => [node.id, node]))
        const queue = getStartNodes(params.workflow.definition.nodes, params.workflow.definition.edges)
        const visited = new Set<string>()

        if (queue.length === 0) throw new Error('Workflow cần ít nhất một node để chạy.')

        while (queue.length > 0) {
            const node = queue.shift()
            if (!node || visited.has(node.id)) continue
            visited.add(node.id)

            const nodeStartedAt = Date.now()
            await writeLog(context, 'info', `Đang chạy node: ${node.data.label}`, node.id)

            const result = await executeNode(node, context)
            context.outputs[node.id] = result

            await writeLog(context, 'info', `Hoàn tất node: ${node.data.label}`, node.id, {
                durationMs: Date.now() - nodeStartedAt,
            })

            for (const edge of getNextEdges(node, result, params.workflow.definition.edges)) {
                const nextNode = nodesById.get(edge.target)
                if (nextNode && !visited.has(nextNode.id)) queue.push(nextNode)
            }
        }

        const output = { nodes: context.outputs }
        const completedAt = nowIso()

        const db = params.supabase as any
        await db.from('workflow_executions').update({
            status: 'success',
            output,
            completed_at: completedAt,
            duration_ms: Date.now() - startedAt,
        }).eq('id', params.executionId).eq('user_id', params.userId)

        await db.from('workflows').update({
            last_run_at: completedAt,
        }).eq('id', params.workflow.id).eq('user_id', params.userId)

        await writeLog(context, 'info', 'Flow chạy thành công.')

        return {
            status: 'success' as const,
            output,
            logs: context.logs,
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Workflow execution failed.'

        await writeLog(context, 'error', message)
        const db = params.supabase as any
        await db.from('workflow_executions').update({
            status: 'failed',
            error_message: message,
            completed_at: nowIso(),
            duration_ms: Date.now() - startedAt,
        }).eq('id', params.executionId).eq('user_id', params.userId)

        return {
            status: 'failed' as const,
            error: message,
            logs: context.logs,
        }
    }
}
