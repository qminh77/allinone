import type { NodeTypes } from '@xyflow/react'
import { AiAgentNode } from '@/components/workflows/nodes/AiAgentNode'
import { ConditionNode } from '@/components/workflows/nodes/ConditionNode'
import { FlashcardGeneratorNode } from '@/components/workflows/nodes/FlashcardGeneratorNode'
import { HttpRequestNode } from '@/components/workflows/nodes/HttpRequestNode'
import { LoopNode } from '@/components/workflows/nodes/LoopNode'
import { QrGeneratorNode } from '@/components/workflows/nodes/QrGeneratorNode'
import { SupabaseQueryNode } from '@/components/workflows/nodes/SupabaseQueryNode'
import { TelegramBotNode } from '@/components/workflows/nodes/TelegramBotNode'
import { TriggerNode } from '@/components/workflows/nodes/TriggerNode'
import { ZaloBotNode } from '@/components/workflows/nodes/ZaloBotNode'

export const workflowNodeTypes = {
    trigger: TriggerNode,
    condition: ConditionNode,
    loop: LoopNode,
    httpRequest: HttpRequestNode,
    aiAgent: AiAgentNode,
    flashcardGenerator: FlashcardGeneratorNode,
    qrGenerator: QrGeneratorNode,
    supabaseQuery: SupabaseQueryNode,
    telegramBot: TelegramBotNode,
    zaloBot: ZaloBotNode,
} satisfies NodeTypes
