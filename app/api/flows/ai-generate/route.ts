import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateJson } from '@/lib/ai/service'
import { WORKFLOW_NODE_DEFINITIONS } from '@/lib/workflows/registry'
import { WorkflowAiGenerateInputSchema, WorkflowDefinitionSchema } from '@/types/workflow'

const AiWorkflowResultSchema = z.object({
    name: z.string().trim().min(3).max(160),
    description: z.string().trim().max(2000).optional().nullable(),
    definition: WorkflowDefinitionSchema,
})

function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return jsonError('Unauthorized', 401)

        const body = await request.json().catch(() => null)
        const parsed = WorkflowAiGenerateInputSchema.safeParse(body)
        if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400)

        const result = await generateJson<unknown>({
            featureKey: 'flow.ai.generate',
            userId: user.id,
            modelDbId: parsed.data.modelDbId,
            system: [
                'You generate Allinone Flow workflow JSON for React Flow.',
                'Return only JSON with name, description, definition.',
                'definition.version must be 1. Use only the supported node types and config fields.',
                'Each node must include id, type, position {x,y}, data {label,nodeType,description,config}.',
                'Edges must include id, source, target. Condition edges can use sourceHandle "true" or "false".',
            ].join(' '),
            prompt: JSON.stringify({
                userPrompt: parsed.data.prompt,
                supportedNodes: WORKFLOW_NODE_DEFINITIONS.map(node => ({
                    type: node.type,
                    label: node.label,
                    description: node.description,
                    defaultConfig: node.defaultConfig,
                })),
                botNodeGuidance: [
                    'For aiAgent, never use modelDbId. Use endpoint, apiKey, model, system, prompt, responsePath and outputKey. Prefer apiKey {{input.aiApiKey}} unless the user names a different runtime field.',
                    'For telegramBot, prefer botToken {{input.telegramBotToken}} and chatId {{input.telegramChatId}} unless the user names different runtime fields.',
                    'For zaloBot, prefer botToken {{input.zaloBotToken}} and chatId {{input.zaloChatId}} unless the user names different runtime fields.',
                    'Use payload JSON only for optional API parameters or custom methods.',
                ],
                layoutGuidance: 'Place nodes left-to-right with x increments around 320 and y increments around 140.',
            }),
            maxTokens: 5000,
            temperature: 0.2,
        })

        const workflow = AiWorkflowResultSchema.parse(result)
        return NextResponse.json(workflow)
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Không thể sinh workflow bằng AI.', 500)
    }
}
