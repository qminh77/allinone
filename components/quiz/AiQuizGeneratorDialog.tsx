'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
import { generateAndInsertQuizQuestions } from '@/lib/actions/ai'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AiModelSelect } from '@/components/ai/AiModelSelect'

interface AiQuizGeneratorDialogProps {
    quizId: string
}

export function AiQuizGeneratorDialog({ quizId }: AiQuizGeneratorDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [topic, setTopic] = useState('')
    const [count, setCount] = useState(8)
    const [difficulty, setDifficulty] = useState('trung bình')
    const [notes, setNotes] = useState('')
    const [modelDbId, setModelDbId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleGenerate() {
        startTransition(async () => {
            const result = await generateAndInsertQuizQuestions(quizId, {
                topic,
                count,
                difficulty,
                notes,
                modelDbId,
            })

            if (result.error) {
                toast.error(result.error)
                return
            }

            const importedCount = result.count || 0
            toast.success(`Đã thêm ${importedCount} câu hỏi`)
            if (result.errors?.length) {
                toast.warning(`Có ${result.errors.length} lỗi khi lưu câu hỏi`)
            }
            setOpen(false)
            setTopic('')
            setNotes('')
            router.refresh()
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Sparkles className="size-4" />
                    AI tạo câu hỏi
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>AI tạo câu hỏi</DialogTitle>
                    <DialogDescription>Câu hỏi tạo xong sẽ được thêm vào quiz hiện tại.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <AiModelSelect value={modelDbId} onChange={setModelDbId} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ai-quiz-topic">Chủ đề</Label>
                        <Textarea
                            id="ai-quiz-topic"
                            value={topic}
                            onChange={(event) => setTopic(event.target.value)}
                            placeholder="Ví dụ: kiểm tra kiến thức React hooks cơ bản..."
                            rows={4}
                            maxLength={1000}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="ai-quiz-count">Số câu</Label>
                            <Input id="ai-quiz-count" type="number" min={1} max={30} value={count} onChange={(event) => setCount(Number(event.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ai-quiz-difficulty">Độ khó</Label>
                            <Input id="ai-quiz-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ai-quiz-notes">Ghi chú</Label>
                        <Textarea id="ai-quiz-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={1500} />
                    </div>
                    <div className="flex justify-end">
                        <Button type="button" onClick={handleGenerate} disabled={isPending || topic.trim().length < 3}>
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                            Tạo và thêm
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
