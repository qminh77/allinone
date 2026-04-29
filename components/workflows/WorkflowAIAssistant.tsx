'use client'

import { useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useWorkflowStore } from '@/components/workflows/store/useWorkflowStore'

interface AiWorkflowResponse {
    name: string
    description?: string | null
    definition: unknown
    error?: string
}

export function WorkflowAIAssistant() {
    const [open, setOpen] = useState(false)
    const [prompt, setPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const importDefinition = useWorkflowStore(state => state.importDefinition)

    const generateWorkflow = async () => {
        setIsGenerating(true)
        try {
            const response = await fetch('/api/flows/ai-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            })
            const data = await response.json() as AiWorkflowResponse

            if (!response.ok || data.error) throw new Error(data.error || 'Không thể sinh workflow.')

            importDefinition(data.definition, { name: data.name, description: data.description })
            toast.success('AI đã sinh workflow trên canvas.')
            setOpen(false)
            setPrompt('')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể sinh workflow bằng AI.')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Bot className="size-4" />
                    AI Generate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="size-5 text-primary" />
                        AI Workflow Agent
                    </DialogTitle>
                    <DialogDescription>
                        Mô tả automation bạn muốn. AI sẽ tạo JSON workflow dùng đúng node type của Flow.
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Ví dụ: Khi chạy manual, gọi API lấy bài viết, dùng AI tóm tắt, nếu approved thì tạo QR payload cho link bài viết."
                    className="min-h-40"
                />
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>Hủy</Button>
                    <Button type="button" onClick={generateWorkflow} disabled={isGenerating || prompt.trim().length < 10}>
                        {isGenerating ? 'Đang sinh...' : 'Sinh workflow'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
