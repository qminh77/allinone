'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { importQuizFromToken } from '@/lib/actions/quiz'

export function ImportQuizDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [input, setInput] = useState('')

    async function handleImport() {
        if (!input.trim()) return

        setIsLoading(true)
        const lines = input.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        let successCount = 0
        let errors: string[] = []

        try {
            for (const line of lines) {
                // Extract token from URL if full URL provided
                // patterns: /quiz/[token] or just [token]
                let token = line
                if (token.includes('/quiz/')) {
                    const parts = token.split('/quiz/')
                    if (parts[1]) {
                        token = parts[1].split('?')[0] // remove query params if any
                    }
                }

                const res = await importQuizFromToken(token)
                if (res.error) {
                    errors.push(`${line}: ${res.error}`)
                } else {
                    successCount++
                }
            }

            if (successCount > 0) {
                toast.success(`Đã nhập thành công ${successCount} bộ câu hỏi!`)
            }

            if (errors.length > 0) {
                toast.error(`Có lỗi với ${errors.length} dòng.`)
                console.error('Import errors:', errors)
            }

            if (errors.length === 0 && successCount > 0) {
                setOpen(false)
                setInput('')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi nhập')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Nhập từ Token
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nhập bộ câu hỏi</DialogTitle>
                    <DialogDescription>
                        Nhập danh sách mã Token (hoặc link chia sẻ), mỗi mã một dòng.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="link">Danh sách Token</Label>
                        <Textarea
                            id="link"
                            placeholder={"token-1\ntoken-2\n..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="min-h-[150px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleImport} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? `Đang nhập...` : 'Nhập ngay'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
