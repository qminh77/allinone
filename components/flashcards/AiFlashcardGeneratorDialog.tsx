'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
import { generateAndImportFlashcards } from '@/lib/actions/ai'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AiModelSelect } from '@/components/ai/AiModelSelect'

interface AiFlashcardGeneratorDialogProps {
    setId: string
}

export function AiFlashcardGeneratorDialog({ setId }: AiFlashcardGeneratorDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [topic, setTopic] = useState('')
    const [count, setCount] = useState(12)
    const [difficulty, setDifficulty] = useState('trung bình')
    const [notes, setNotes] = useState('')
    const [modelDbId, setModelDbId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleGenerate() {
        startTransition(async () => {
            const result = await generateAndImportFlashcards(setId, {
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

            toast.success(`Đã thêm ${result.count} flashcard`)
            setOpen(false)
            setTopic('')
            setNotes('')
            router.refresh()
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">
                    <Sparkles className="size-4" />
                    AI tạo card
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>AI tạo flashcard</DialogTitle>
                    <DialogDescription>AI dùng logic tạo câu hỏi như quiz, rồi chuyển thành mặt trước/mặt sau của flashcard.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <AiModelSelect value={modelDbId} onChange={setModelDbId} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ai-flashcard-topic">Chủ đề</Label>
                        <Textarea
                            id="ai-flashcard-topic"
                            value={topic}
                            onChange={(event) => setTopic(event.target.value)}
                            placeholder="Ví dụ: kiểm tra kiến thức React hooks cơ bản..."
                            rows={4}
                            maxLength={1000}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="ai-flashcard-count">Số lượng</Label>
                            <Input id="ai-flashcard-count" type="number" min={3} max={50} value={count} onChange={(event) => setCount(Number(event.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ai-flashcard-difficulty">Độ khó</Label>
                            <Input id="ai-flashcard-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ai-flashcard-notes">Ghi chú</Label>
                        <Textarea id="ai-flashcard-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={1500} />
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
