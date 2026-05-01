'use server'

import { z } from 'zod'
import { requireAuthenticated } from '@/lib/auth/authorization-middleware'
import { generateJson, getPublicAiModels } from '@/lib/ai/service'
import { importFlashcardCards } from '@/lib/actions/flashcards'
import { createQuestionsBatch } from '@/lib/actions/quiz'
import {
    buildQrPayload,
    mergeQrDesign,
    mergeQrFormValues,
    QR_TYPE_DEFINITIONS,
    type QrDesign,
    type QrFormValues,
    type QrType,
} from '@/lib/qr-code'
import { getModuleCatalog } from '@/lib/modules/catalog'

const ModelIdSchema = z.string().uuid().optional().nullable()

function trimText(value: string, maxLength: number) {
    return value.trim().replace(/\0/g, '').slice(0, maxLength)
}

function stripUnsafeHtml(html: string) {
    return html
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
        .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .trim()
        .slice(0, 50_000)
}

export async function getAiModelOptions() {
    await requireAuthenticated()
    try {
        return await getPublicAiModels()
    } catch {
        return []
    }
}

const baseDestinations = [
    { moduleKey: 'mail-system', href: '/dashboard/mail/send', title: 'Gửi Mail', keywords: ['mail', 'email', 'gửi mail', 'soạn mail', 'send email'] },
    { moduleKey: 'mail-system', href: '/dashboard/mail/accounts', title: 'Tài khoản mail', keywords: ['smtp', 'tài khoản mail', 'mail account'] },
    { moduleKey: 'quiz-system', href: '/dashboard/quiz/create', title: 'Tạo Quiz', keywords: ['quiz', 'trắc nghiệm', 'bài kiểm tra', 'tạo quiz'] },
    { moduleKey: 'quiz-system', href: '/dashboard/quiz/my-quizzes', title: 'Bộ câu hỏi', keywords: ['danh sách quiz', 'bộ câu hỏi', 'my quizzes'] },
    { moduleKey: 'flashcard-system', href: '/dashboard/flashcards/create', title: 'Tạo Flashcard', keywords: ['flashcard', 'thẻ học', 'tạo flashcard', 'từ vựng'] },
    { moduleKey: 'flashcard-system', href: '/dashboard/flashcards/library', title: 'My Library', keywords: ['library', 'thư viện flashcard', 'bộ flashcard'] },
]

async function getDestinations() {
    const catalog = await getModuleCatalog()
    const enabledModuleKeys = new Set(catalog.filter(module => module.isEnabled !== false).map(module => module.key))

    return [
        ...baseDestinations
            .filter(destination => enabledModuleKeys.has(destination.moduleKey))
            .map(destination => ({
                href: destination.href,
                title: destination.title,
                keywords: destination.keywords,
            })),
        ...catalog.filter(module => module.isEnabled !== false).map(module => ({
            href: module.href,
            title: module.name,
            keywords: [module.key, module.name, module.description, module.category],
        })),
    ]
}

function fallbackDestination(query: string, destinations: Awaited<ReturnType<typeof getDestinations>>) {
    const normalized = query.toLowerCase()
    let best = destinations[0]
    let bestScore = 0

    for (const destination of destinations) {
        let score = 0
        for (const keyword of destination.keywords) {
            const words = String(keyword).toLowerCase().split(/[\s,./&()_-]+/).filter(Boolean)
            if (normalized.includes(String(keyword).toLowerCase())) score += 6
            for (const word of words) {
                if (word.length >= 3 && normalized.includes(word)) score += 1
            }
        }

        if (score > bestScore) {
            best = destination
            bestScore = score
        }
    }

    return {
        href: best.href,
        title: best.title,
        confidence: bestScore > 0 ? Math.min(0.85, bestScore / 10) : 0.25,
        message: bestScore > 0 ? `Mở ${best.title}` : 'Không tìm thấy chức năng thật sự khớp.',
    }
}

const CommandResultSchema = z.object({
    href: z.string(),
    title: z.string().max(120),
    confidence: z.number().min(0).max(1),
    message: z.string().max(240),
})

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(6000),
})

const AssistantChatInputSchema = z.object({
    message: z.string().trim().min(1, 'Nhập nội dung cần hỏi.').max(6000),
    history: z.array(ChatMessageSchema).max(12).optional(),
    modelDbId: ModelIdSchema,
})

const AssistantChatResultSchema = z.object({
    reply: z.string().trim().min(1).max(8000),
    actions: z.array(z.object({
        label: z.string().trim().min(1).max(80),
        href: z.string().trim().min(1).max(240),
        description: z.string().trim().max(180).optional(),
    })).max(4).optional(),
})

function looksLikeActionRequest(message: string) {
    const value = message.toLowerCase()
    return [
        'mở',
        'đi tới',
        'vào',
        'tạo',
        'làm',
        'soạn',
        'gửi',
        'generate',
        'open',
        'create',
        'go to',
        'navigate',
    ].some(keyword => value.includes(keyword))
}

export async function chatWithAiAssistant(input: z.infer<typeof AssistantChatInputSchema>) {
    const user = await requireAuthenticated()
    const parsed = AssistantChatInputSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const destinations = await getDestinations()
    const allowedHrefs = new Set(destinations.map(item => item.href))
    const fallback = fallbackDestination(parsed.data.message, destinations)

    try {
        const result = await generateJson<unknown>({
            featureKey: 'dashboard.ai.chat',
            userId: user.id,
            modelDbId: parsed.data.modelDbId,
            system: [
                'You are the Allinone web assistant.',
                'Reply naturally in Vietnamese unless the user asks for another language.',
                'You can answer general questions, explain workflows, draft content, and help users use this web app.',
                'When the user asks to do something in the web app, include actions that point to existing hrefs only.',
                'You cannot directly click buttons, submit forms, delete data, or access secrets. For risky actions, guide the user and ask for confirmation.',
                'Return strictly valid JSON with shape: { "reply": string, "actions": [{ "label": string, "href": string, "description": string }] }.',
            ].join(' '),
            prompt: JSON.stringify({
                currentUserMessage: parsed.data.message,
                recentHistory: (parsed.data.history || []).slice(-10),
                availableDestinations: destinations.map(item => ({
                    href: item.href,
                    title: item.title,
                    keywords: item.keywords.slice(0, 4),
                })),
            }),
            maxTokens: 2200,
            temperature: 0.35,
        })

        const chat = AssistantChatResultSchema.parse(result)
        const actions = (chat.actions || [])
            .filter(action => allowedHrefs.has(action.href))
            .slice(0, 3)

        if (actions.length === 0 && looksLikeActionRequest(parsed.data.message) && fallback.confidence >= 0.35) {
            actions.push({
                label: fallback.title,
                href: fallback.href,
                description: fallback.message,
            })
        }

        return {
            success: true,
            reply: chat.reply,
            actions,
        }
    } catch (error) {
        if (looksLikeActionRequest(parsed.data.message) && fallback.confidence >= 0.35) {
            return {
                success: true,
                reply: `Mình có thể mở nhanh chức năng phù hợp nhất là ${fallback.title}.`,
                actions: [{
                    label: fallback.title,
                    href: fallback.href,
                    description: fallback.message,
                }],
            }
        }

        return { error: error instanceof Error ? error.message : 'Không thể gọi trợ lý AI.' }
    }
}

export async function resolveAiCommand(query: string, modelDbId?: string | null) {
    const user = await requireAuthenticated()
    const safeQuery = trimText(query, 500)
    if (!safeQuery) return { error: 'Nhập nội dung cần tìm hoặc tác vụ cần mở.' }

    const destinations = await getDestinations()
    const fallback = fallbackDestination(safeQuery, destinations)
    const allowedHrefs = new Set(destinations.map(item => item.href))

    try {
        const result = await generateJson<unknown>({
            featureKey: 'dashboard.ai.command',
            userId: user.id,
            modelDbId,
            system: [
                'You route a Vietnamese tool dashboard command to exactly one existing href.',
                'Only return a JSON object with href, title, confidence, message.',
                'Do not invent routes. If uncertain, choose the closest matching href.',
            ].join(' '),
            prompt: JSON.stringify({
                query: safeQuery,
                destinations: destinations.map(item => ({ href: item.href, title: item.title, keywords: item.keywords.slice(0, 3) })),
            }),
            maxTokens: 500,
            temperature: 0.1,
        })

        const parsed = CommandResultSchema.safeParse(result)
        if (!parsed.success || !allowedHrefs.has(parsed.data.href)) {
            return { success: true, ...fallback, aiUsed: false }
        }

        return { success: true, ...parsed.data, aiUsed: true }
    } catch {
        return { success: true, ...fallback, aiUsed: false }
    }
}

const MailDraftInputSchema = z.object({
    purpose: z.string().trim().min(5, 'Mô tả mail quá ngắn').max(2000),
    audience: z.string().trim().max(300).optional(),
    tone: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(1200).optional(),
    modelDbId: ModelIdSchema,
})

const MailDraftSchema = z.object({
    subject: z.string().trim().min(1).max(180),
    bodyHtml: z.string().trim().min(1).max(50_000),
})

export async function generateMailDraft(input: z.infer<typeof MailDraftInputSchema>) {
    const user = await requireAuthenticated()
    const parsed = MailDraftInputSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    try {
        const result = await generateJson<unknown>({
            featureKey: 'mail.ai.draft',
            userId: user.id,
            modelDbId: parsed.data.modelDbId,
            system: 'You write concise, professional Vietnamese email drafts. Return JSON only.',
            prompt: JSON.stringify({
                task: 'Create an email subject and HTML body.',
                purpose: parsed.data.purpose,
                audience: parsed.data.audience || '',
                tone: parsed.data.tone || 'chuyên nghiệp, rõ ràng',
                notes: parsed.data.notes || '',
                outputShape: { subject: 'string', bodyHtml: 'safe HTML without scripts/styles' },
            }),
            maxTokens: 1400,
            temperature: 0.45,
        })

        const draft = MailDraftSchema.parse(result)
        return {
            success: true,
            subject: trimText(draft.subject, 180),
            bodyHtml: stripUnsafeHtml(draft.bodyHtml),
        }
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Không thể tạo nháp mail.' }
    }
}

const FlashcardGenerateInputSchema = z.object({
    topic: z.string().trim().min(3, 'Chủ đề quá ngắn').max(1000),
    count: z.coerce.number().int().min(3).max(50).default(12),
    difficulty: z.string().trim().max(80).optional(),
    language: z.string().trim().max(80).optional(),
    notes: z.string().trim().max(1500).optional(),
    modelDbId: ModelIdSchema,
})

const GeneratedQuizSchema = z.object({
    questions: z.array(z.object({
        content: z.string().trim().min(3).max(2000),
        type: z.enum(['single', 'multiple']).default('single'),
        explanation: z.string().trim().max(2000).optional().nullable(),
        answers: z.array(z.object({
            content: z.string().trim().min(1).max(1000),
            is_correct: z.boolean(),
        })).min(2).max(6),
    })).min(1).max(50),
})

type GeneratedQuizQuestion = z.infer<typeof GeneratedQuizSchema>['questions'][number]

function normalizeGeneratedQuizQuestion(question: GeneratedQuizQuestion) {
    const hasCorrect = question.answers.some(answer => answer.is_correct)
    const normalizedAnswers = hasCorrect
        ? question.answers
        : question.answers.map((answer, answerIndex) => ({ ...answer, is_correct: answerIndex === 0 }))
    const correctCount = normalizedAnswers.filter(answer => answer.is_correct).length
    const questionType: 'single' | 'multiple' = correctCount > 1 ? 'multiple' : 'single'

    return {
        normalizedAnswers,
        questionType,
    }
}

function quizQuestionToFlashcard(question: GeneratedQuizQuestion) {
    const { normalizedAnswers } = normalizeGeneratedQuizQuestion(question)
    const correctAnswers = normalizedAnswers
        .filter(answer => answer.is_correct)
        .map(answer => answer.content)
    const definitionParts = [`**Đáp án:** ${correctAnswers.join('; ')}`]
    const explanation = question.explanation?.trim()

    if (explanation) {
        definitionParts.push(`**Giải thích:** ${explanation}`)
    }

    return {
        term: trimText(question.content, 500),
        definition: trimText(definitionParts.join('\n\n'), 5000),
    }
}

export async function generateAndImportFlashcards(setId: string, input: z.infer<typeof FlashcardGenerateInputSchema>) {
    const user = await requireAuthenticated()
    const parsed = FlashcardGenerateInputSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    try {
        const result = await generateJson<unknown>({
            featureKey: 'flashcards.ai.generate',
            userId: user.id,
            modelDbId: parsed.data.modelDbId,
            system: 'You create fair, unambiguous quiz-style study questions in Vietnamese unless another language is requested. Return JSON only.',
            prompt: JSON.stringify({
                topic: parsed.data.topic,
                count: parsed.data.count,
                difficulty: parsed.data.difficulty || 'trung bình',
                language: parsed.data.language || 'Vietnamese',
                notes: parsed.data.notes || '',
                requirements: [
                    'Create questions using the same logic as the quiz generator.',
                    'Each question needs 4 answers by default.',
                    'Single questions must have exactly one correct answer.',
                    'Multiple questions can have two or more correct answers.',
                    'Add a short explanation for learning.',
                    'Questions should test one concept and work well as the front side of a flashcard.',
                    'Avoid duplicates.',
                ],
                outputShape: {
                    questions: [{
                        content: 'string',
                        type: 'single or multiple',
                        explanation: 'string',
                        answers: [{ content: 'string', is_correct: true }],
                    }],
                },
            }),
            maxTokens: Math.min(6000, 450 + parsed.data.count * 260),
            temperature: 0.35,
        })

        const parsedQuestions = GeneratedQuizSchema.parse(result).questions.slice(0, parsed.data.count)
        const cards = parsedQuestions.map(quizQuestionToFlashcard)
        const importResult = await importFlashcardCards(setId, cards)
        if (importResult.error) return { error: importResult.error }

        return { success: true, count: importResult.count || cards.length }
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Không thể tạo flashcard.' }
    }
}

const QuizGenerateInputSchema = z.object({
    topic: z.string().trim().min(3, 'Chủ đề quá ngắn').max(1000),
    count: z.coerce.number().int().min(1).max(30).default(8),
    difficulty: z.string().trim().max(80).optional(),
    notes: z.string().trim().max(1500).optional(),
    modelDbId: ModelIdSchema,
})

export async function generateAndInsertQuizQuestions(quizId: string, input: z.infer<typeof QuizGenerateInputSchema>) {
    const user = await requireAuthenticated()
    const parsed = QuizGenerateInputSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    try {
        const result = await generateJson<unknown>({
            featureKey: 'quiz.ai.generate',
            userId: user.id,
            modelDbId: parsed.data.modelDbId,
            system: 'You create fair, unambiguous quiz questions in Vietnamese. Return JSON only.',
            prompt: JSON.stringify({
                topic: parsed.data.topic,
                count: parsed.data.count,
                difficulty: parsed.data.difficulty || 'trung bình',
                notes: parsed.data.notes || '',
                requirements: [
                    'Each question needs 4 answers by default.',
                    'Single questions must have exactly one correct answer.',
                    'Multiple questions can have two or more correct answers.',
                    'Add a short explanation for learning.',
                ],
                outputShape: {
                    questions: [{
                        content: 'string',
                        type: 'single or multiple',
                        explanation: 'string',
                        answers: [{ content: 'string', is_correct: true }],
                    }],
                },
            }),
            maxTokens: Math.min(6000, 450 + parsed.data.count * 260),
            temperature: 0.35,
        })

        const parsedQuestions = GeneratedQuizSchema.parse(result).questions.slice(0, parsed.data.count)
        const questionsData = parsedQuestions.map((question, index) => {
            const { normalizedAnswers, questionType } = normalizeGeneratedQuizQuestion(question)

            return {
                question: {
                    content: question.content,
                    type: questionType,
                    explanation: question.explanation || '',
                    media_url: '',
                    media_type: undefined,
                    order_index: index,
                },
                answers: normalizedAnswers.map((answer, answerIndex) => ({
                    content: answer.content,
                    is_correct: answer.is_correct,
                    order_index: answerIndex,
                })),
            }
        })

        const importResult = await createQuestionsBatch(quizId, questionsData)
        const importError = 'error' in importResult ? importResult.error : null
        if (typeof importError === 'string') return { error: importError }

        return { success: true, count: importResult.count || questionsData.length, errors: importResult.errors || [] }
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Không thể tạo câu hỏi.' }
    }
}

const QrTypeSchema = z.enum([
    'url',
    'text',
    'email',
    'phone',
    'sms',
    'wifi',
    'vcard',
    'location',
    'event',
    'social',
    'crypto',
    'file',
    'app',
])

const QrDraftInputSchema = z.object({
    prompt: z.string().trim().min(5, 'Mô tả QR quá ngắn').max(2000),
    preferredType: z.union([QrTypeSchema, z.literal('auto')]).default('auto'),
    modelDbId: ModelIdSchema,
})

const QrFormDraftSchema = z.object({
    url: z.string().max(2048).optional(),
    text: z.string().max(2500).optional(),
    email: z.object({
        to: z.string().max(254).optional(),
        subject: z.string().max(240).optional(),
        body: z.string().max(1000).optional(),
    }).optional(),
    phone: z.string().max(40).optional(),
    sms: z.object({
        phone: z.string().max(40).optional(),
        message: z.string().max(500).optional(),
    }).optional(),
    wifi: z.object({
        ssid: z.string().max(120).optional(),
        password: z.string().max(120).optional(),
        encryption: z.enum(['WPA', 'WEP', 'nopass']).optional(),
        hidden: z.boolean().optional(),
    }).optional(),
    vcard: z.object({
        firstName: z.string().max(120).optional(),
        lastName: z.string().max(120).optional(),
        organization: z.string().max(160).optional(),
        title: z.string().max(160).optional(),
        phone: z.string().max(40).optional(),
        email: z.string().max(254).optional(),
        website: z.string().max(2048).optional(),
        address: z.string().max(500).optional(),
        note: z.string().max(500).optional(),
    }).optional(),
    location: z.object({
        latitude: z.string().max(40).optional(),
        longitude: z.string().max(40).optional(),
        label: z.string().max(160).optional(),
    }).optional(),
    event: z.object({
        title: z.string().max(200).optional(),
        description: z.string().max(1000).optional(),
        location: z.string().max(300).optional(),
        startsAt: z.string().max(40).optional(),
        endsAt: z.string().max(40).optional(),
    }).optional(),
    social: z.object({
        platform: z.enum(['facebook', 'instagram', 'youtube', 'tiktok', 'zalo']).optional(),
        value: z.string().max(2048).optional(),
    }).optional(),
    crypto: z.object({
        network: z.enum(['bitcoin', 'ethereum', 'litecoin', 'dogecoin', 'custom']).optional(),
        address: z.string().max(180).optional(),
        amount: z.string().max(80).optional(),
        label: z.string().max(160).optional(),
    }).optional(),
    file: z.object({
        url: z.string().max(2048).optional(),
    }).optional(),
    app: z.object({
        platform: z.enum(['app-store', 'play-store', 'direct']).optional(),
        value: z.string().max(2048).optional(),
    }).optional(),
}).partial()

const QrDraftSchema = z.object({
    type: QrTypeSchema,
    name: z.string().trim().min(1).max(160).optional(),
    folder: z.string().trim().max(80).optional(),
    tags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
    form: QrFormDraftSchema,
    design: z.object({
        foreground: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
        background: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
        size: z.number().int().min(200).max(2000).optional(),
        errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional(),
    }).optional(),
})

export async function generateQrCodeDraft(input: z.infer<typeof QrDraftInputSchema>) {
    const user = await requireAuthenticated()
    const parsed = QrDraftInputSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    try {
        const result = await generateJson<unknown>({
            featureKey: 'qr.ai.generate',
            userId: user.id,
            modelDbId: parsed.data.modelDbId,
            system: [
                'You create QR Code configuration for the Allinone QR Code Generator.',
                'Return JSON only. Choose the most suitable QR type and fill only fields needed by that type.',
                'For event date-time fields, use local datetime-local format YYYY-MM-DDTHH:mm.',
                'For URLs, include a full https URL when possible.',
            ].join(' '),
            prompt: JSON.stringify({
                prompt: parsed.data.prompt,
                preferredType: parsed.data.preferredType,
                availableTypes: QR_TYPE_DEFINITIONS.map(item => ({
                    key: item.key,
                    name: item.name,
                    description: item.description,
                })),
                outputShape: {
                    type: 'one of available type keys',
                    name: 'short display name',
                    folder: 'optional folder',
                    tags: ['optional', 'tags'],
                    form: 'object matching the chosen QR type',
                    design: {
                        foreground: '#111827',
                        background: '#ffffff',
                        size: 800,
                        errorCorrectionLevel: 'M',
                    },
                },
            }),
            maxTokens: 1800,
            temperature: 0.25,
        })

        const draft = QrDraftSchema.parse(result)
        const form = mergeQrFormValues(draft.form as Partial<QrFormValues>)
        const design = mergeQrDesign(draft.design as Partial<QrDesign> | undefined)
        const type = draft.type as QrType
        const payloadResult = buildQrPayload(type, form)

        if (payloadResult.error) {
            return { error: `AI tạo QR chưa hợp lệ: ${payloadResult.error}` }
        }

        return {
            success: true,
            type,
            form,
            design,
            name: draft.name || payloadResult.label,
            folder: draft.folder || '',
            tags: draft.tags || [],
            payload: payloadResult.payload,
        }
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Không thể tạo QR bằng AI.' }
    }
}
