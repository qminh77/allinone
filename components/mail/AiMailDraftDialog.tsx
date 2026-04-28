'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
import { generateMailDraft } from '@/lib/actions/ai'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AiModelSelect } from '@/components/ai/AiModelSelect'

interface AiMailDraftDialogProps {
    onApply: (draft: { subject: string; bodyHtml: string }) => void
}

export function AiMailDraftDialog({ onApply }: AiMailDraftDialogProps) {
    const [open, setOpen] = useState(false)
    const [purpose, setPurpose] = useState('')
    const [audience, setAudience] = useState('')
    const [tone, setTone] = useState('chuyên nghiệp, rõ ràng')
    const [notes, setNotes] = useState('')
    const [modelDbId, setModelDbId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleGenerate() {
        startTransition(async () => {
            const result = await generateMailDraft({
                purpose,
                audience,
                tone,
                notes,
                modelDbId,
            })

            if (result.error) {
                toast.error(result.error)
                return
            }

            onApply({ subject: result.subject!, bodyHtml: result.bodyHtml! })
            toast.success('Đã tạo nháp mail')
            setOpen(false)
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">
                    <Sparkles className="size-4" />
                    AI soạn
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>AI soạn mail</DialogTitle>
                    <DialogDescription>Tạo subject và nội dung HTML từ yêu cầu ngắn.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <AiModelSelect value={modelDbId} onChange={setModelDbId} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ai-mail-purpose">Mục đích</Label>
                        <Textarea
                            id="ai-mail-purpose"
                            value={purpose}
                            onChange={(event) => setPurpose(event.target.value)}
                            placeholder="Ví dụ: gửi thông báo lịch kiểm tra cho học viên..."
                            rows={4}
                            maxLength={2000}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="ai-mail-audience">Người nhận</Label>
                            <Input id="ai-mail-audience" value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Học viên, khách hàng..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ai-mail-tone">Giọng văn</Label>
                            <Input id="ai-mail-tone" value={tone} onChange={(event) => setTone(event.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ai-mail-notes">Ghi chú</Label>
                        <Textarea id="ai-mail-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={1200} />
                    </div>
                    <div className="flex justify-end">
                        <Button type="button" onClick={handleGenerate} disabled={isPending || purpose.trim().length < 5}>
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                            Tạo nháp
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
