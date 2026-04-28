'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Search, Sparkles } from 'lucide-react'
import { resolveAiCommand } from '@/lib/actions/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AiModelSelect } from '@/components/ai/AiModelSelect'
import { cn } from '@/lib/utils'

interface DashboardAiCommandProps {
    className?: string
    showModelSelect?: boolean
}

export function DashboardAiCommand({ className, showModelSelect = false }: DashboardAiCommandProps) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [modelDbId, setModelDbId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const value = query.trim()
        if (!value) return

        startTransition(async () => {
            const result = await resolveAiCommand(value, modelDbId)
            if ('error' in result && result.error) {
                toast.error(result.error)
                return
            }

            if ('href' in result && result.href) {
                toast.success(result.message || 'Đang mở chức năng')
                router.push(result.href)
                return
            }

            toast.error('Không tìm thấy chức năng phù hợp')
        })
    }

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                'flex flex-col gap-2 rounded-lg border bg-card p-2 sm:flex-row sm:items-center',
                className
            )}
        >
            <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Hỏi AI hoặc nhập tác vụ..."
                    className="h-10 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                />
            </div>

            {showModelSelect && (
                <AiModelSelect value={modelDbId} onChange={setModelDbId} className="w-full sm:w-60" />
            )}

            <Button type="submit" disabled={isPending || !query.trim()} className="shrink-0">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Mở
            </Button>
        </form>
    )
}
