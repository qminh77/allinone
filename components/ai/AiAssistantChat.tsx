'use client'

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bot, Copy, ExternalLink, Loader2, Plus, SendHorizontal, Sparkles, Trash2, User } from 'lucide-react'
import { chatWithAiAssistant } from '@/lib/actions/ai'
import { AiModelSelect } from '@/components/ai/AiModelSelect'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type ChatRole = 'user' | 'assistant'

interface AssistantAction {
    label: string
    href: string
    description?: string
}

interface ChatMessage {
    id: string
    role: ChatRole
    content: string
    actions?: AssistantAction[]
    createdAt: string
}

interface AiAssistantChatProps {
    variant?: 'page' | 'sheet'
    className?: string
}

const STORAGE_KEY = 'allinone.ai-assistant.chat.v1'

const quickPrompts = [
    'Mở công cụ QR Code',
    'Tạo quiz từ nội dung bài học',
    'Soạn email thông báo lịch học',
    'Tạo flashcard tiếng Anh',
]

function createMessage(role: ChatRole, content: string, actions?: AssistantAction[]): ChatMessage {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        content,
        actions,
        createdAt: new Date().toISOString(),
    }
}

function readStoredMessages() {
    if (typeof window === 'undefined') return []

    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
        if (!Array.isArray(parsed)) return []
        return parsed
            .filter((item): item is ChatMessage => (
                item
                && (item.role === 'user' || item.role === 'assistant')
                && typeof item.content === 'string'
                && typeof item.id === 'string'
            ))
            .slice(-60)
    } catch {
        return []
    }
}

async function copyText(value: string) {
    await navigator.clipboard?.writeText(value)
    toast.success('Đã copy')
}

export function AiAssistantChat({ variant = 'page', className }: AiAssistantChatProps) {
    const router = useRouter()
    const [messages, setMessages] = useState<ChatMessage[]>(() => readStoredMessages())
    const [input, setInput] = useState('')
    const [modelDbId, setModelDbId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const scrollAnchorRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const isEmpty = messages.length === 0
    const historyForServer = useMemo(() => messages
        .map(message => ({ role: message.role, content: message.content }))
        .slice(-12), [messages])

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)))
        scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [messages])

    function resetChat() {
        setMessages([])
        setInput('')
        window.localStorage.removeItem(STORAGE_KEY)
        inputRef.current?.focus()
    }

    function openAction(action: AssistantAction) {
        router.push(action.href)
        toast.success(`Đang mở ${action.label}`)
    }

    function submitMessage(messageText = input) {
        const content = messageText.trim()
        if (!content || isPending) return

        const userMessage = createMessage('user', content)
        setMessages(prev => [...prev, userMessage])
        setInput('')

        startTransition(async () => {
            const result = await chatWithAiAssistant({
                message: content,
                history: historyForServer,
                modelDbId,
            })

            if (result.error) {
                toast.error(result.error)
                setMessages(prev => [...prev, createMessage('assistant', 'Mình chưa xử lý được yêu cầu này. Kiểm tra cấu hình AI trong AdminCP rồi thử lại.')])
                return
            }

            setMessages(prev => [...prev, createMessage('assistant', result.reply || '', result.actions || [])])
        })
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        submitMessage()
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submitMessage()
        }
    }

    return (
        <TooltipProvider delayDuration={100}>
            <section
                className={cn(
                    'flex min-h-0 flex-col rounded-lg border bg-background',
                    variant === 'page' ? 'h-[calc(100vh-11rem)] min-h-[620px]' : 'h-full rounded-none border-0',
                    className
                )}
            >
                <header className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                <Bot className="size-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="truncate text-base font-semibold">Allinone AI</h2>
                                <Badge variant="secondary">Assistant</Badge>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">Chat, hỏi đáp và mở tác vụ trong dashboard.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <AiModelSelect value={modelDbId} onChange={setModelDbId} className="h-9 w-full sm:w-64" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="button" variant="outline" size="icon" onClick={resetChat}>
                                    {isEmpty ? <Plus className="size-4" /> : <Trash2 className="size-4" />}
                                    <span className="sr-only">New chat</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>New chat</TooltipContent>
                        </Tooltip>
                    </div>
                </header>

                <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-4 p-3 sm:p-4">
                        {isEmpty && (
                            <div className="grid min-h-[320px] place-items-center">
                                <div className="w-full max-w-2xl space-y-5 text-center">
                                    <div className="mx-auto grid size-14 place-items-center rounded-lg border bg-muted">
                                        <Sparkles className="size-6 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold">Bạn muốn làm gì?</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Hỏi tự do hoặc yêu cầu mở một chức năng trong Allinone.
                                        </p>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {quickPrompts.map(prompt => (
                                            <Button
                                                key={prompt}
                                                type="button"
                                                variant="outline"
                                                className="h-auto justify-start whitespace-normal px-3 py-3 text-left"
                                                onClick={() => submitMessage(prompt)}
                                            >
                                                <Sparkles className="size-4" />
                                                {prompt}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={cn(
                                    'flex gap-3',
                                    message.role === 'user' && 'justify-end'
                                )}
                            >
                                {message.role === 'assistant' && (
                                    <Avatar className="mt-1 size-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            <Bot className="size-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                )}

                                <div className={cn('max-w-[86%] space-y-2', message.role === 'user' && 'items-end')}>
                                    <div
                                        className={cn(
                                            'rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm',
                                            message.role === 'assistant'
                                                ? 'border bg-card text-card-foreground'
                                                : 'bg-primary text-primary-foreground'
                                        )}
                                    >
                                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                                    </div>

                                    {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                                        <div className="grid gap-2">
                                            {message.actions.map(action => (
                                                <button
                                                    key={`${message.id}-${action.href}`}
                                                    type="button"
                                                    onClick={() => openAction(action)}
                                                    className="group rounded-lg border bg-background p-3 text-left text-sm transition-colors hover:bg-muted"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-medium">{action.label}</p>
                                                            {action.description && (
                                                                <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                                                            )}
                                                            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{action.href}</p>
                                                        </div>
                                                        <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', message.role === 'user' && 'justify-end')}>
                                        <span>{new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        <Button type="button" variant="ghost" size="icon-sm" className="size-6" onClick={() => copyText(message.content)}>
                                            <Copy className="size-3" />
                                            <span className="sr-only">Copy message</span>
                                        </Button>
                                    </div>
                                </div>

                                {message.role === 'user' && (
                                    <Avatar className="mt-1 size-8">
                                        <AvatarFallback>
                                            <User className="size-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}

                        {isPending && (
                            <div className="flex gap-3">
                                <Avatar className="mt-1 size-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        <Bot className="size-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
                                    <Loader2 className="mr-2 inline size-4 animate-spin" />
                                    Đang trả lời...
                                </div>
                            </div>
                        )}

                        <div ref={scrollAnchorRef} />
                    </div>
                </ScrollArea>

                <Separator />

                <form onSubmit={handleSubmit} className="space-y-2 p-3">
                    <Textarea
                        ref={inputRef}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập câu hỏi hoặc tác vụ..."
                        rows={variant === 'page' ? 3 : 2}
                        className="max-h-40 min-h-20 resize-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">Enter để gửi, Shift+Enter xuống dòng.</p>
                        <Button type="submit" disabled={isPending || !input.trim()}>
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
                            Gửi
                        </Button>
                    </div>
                </form>
            </section>
        </TooltipProvider>
    )
}
