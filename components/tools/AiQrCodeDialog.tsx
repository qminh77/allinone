'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
import { generateQrCodeDraft } from '@/lib/actions/ai'
import { QR_TYPE_DEFINITIONS, type QrDesign, type QrFormValues, type QrType } from '@/lib/qr-code'
import { AiModelSelect } from '@/components/ai/AiModelSelect'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type PreferredQrType = QrType | 'auto' | 'current'

interface AiQrCodeDraft {
    type: QrType
    form: QrFormValues
    design: QrDesign
    name: string
    folder: string
    tags: string[]
}

interface AiQrCodeDialogProps {
    currentType: QrType
    onApply: (draft: AiQrCodeDraft) => void
}

export function AiQrCodeDialog({ currentType, onApply }: AiQrCodeDialogProps) {
    const [open, setOpen] = useState(false)
    const [prompt, setPrompt] = useState('')
    const [preferredType, setPreferredType] = useState<PreferredQrType>('auto')
    const [modelDbId, setModelDbId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleGenerate() {
        startTransition(async () => {
            const result = await generateQrCodeDraft({
                prompt,
                preferredType: preferredType === 'current' ? currentType : preferredType,
                modelDbId,
            })

            if ('error' in result && result.error) {
                toast.error(result.error)
                return
            }

            if (!('success' in result) || !result.success || !result.type || !result.form || !result.design) {
                toast.error('AI không trả về QR hợp lệ.')
                return
            }

            onApply({
                type: result.type as QrType,
                form: result.form as QrFormValues,
                design: result.design as QrDesign,
                name: result.name || 'QR Code',
                folder: result.folder || '',
                tags: result.tags || [],
            })
            toast.success('Đã tạo cấu hình QR bằng AI')
            setOpen(false)
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">
                    <Sparkles className="size-4" />
                    AI tạo QR
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>AI tạo QR Code</DialogTitle>
                    <DialogDescription>Nhập yêu cầu tự nhiên, AI sẽ chọn loại QR và điền form phù hợp.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <AiModelSelect value={modelDbId} onChange={setModelDbId} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Loại QR ưu tiên</Label>
                            <Select value={preferredType} onValueChange={(value) => setPreferredType(value as PreferredQrType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Tự chọn</SelectItem>
                                    <SelectItem value="current">Giữ loại hiện tại</SelectItem>
                                    {QR_TYPE_DEFINITIONS.map(type => (
                                        <SelectItem key={type.key} value={type.key}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ai-qr-prompt">Yêu cầu</Label>
                        <Textarea
                            id="ai-qr-prompt"
                            value={prompt}
                            onChange={(event) => setPrompt(event.target.value)}
                            placeholder="Ví dụ: tạo QR WiFi cho mạng Cafe Minh, mật khẩu minh2026, màu xanh đậm. Hoặc tạo QR vCard cho Nguyễn Minh..."
                            rows={6}
                            maxLength={2000}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="button" onClick={handleGenerate} disabled={isPending || prompt.trim().length < 5}>
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                            Tạo QR
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
