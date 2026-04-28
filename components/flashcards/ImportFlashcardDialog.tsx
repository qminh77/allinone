'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { importFlashcardSetFromToken } from '@/lib/actions/flashcards'

function extractFlashcardToken(input: string) {
    let token = input.trim()
    if (token.includes('/flashcard/')) {
        const parts = token.split('/flashcard/')
        token = parts[1]?.split(/[?#]/)[0] || token
    }
    return token
}

export function ImportFlashcardDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [input, setInput] = useState('')

    async function handleImport() {
        if (!input.trim()) return

        setIsLoading(true)
        const lines = input.split('\n').map(line => line.trim()).filter(Boolean)
        let successCount = 0
        const errors: string[] = []

        try {
            for (const line of lines) {
                const token = extractFlashcardToken(line)
                const result = await importFlashcardSetFromToken(token)

                if (result.error) {
                    errors.push(`${line}: ${result.error}`)
                } else {
                    successCount++
                }
            }

            if (successCount > 0) {
                toast.success(`Đã nhập thành công ${successCount} flashcard set!`)
            }

            if (errors.length > 0) {
                toast.error(`Có lỗi với ${errors.length} dòng.`)
                console.error('Flashcard import errors:', errors)
            }

            if (errors.length === 0 && successCount > 0) {
                setOpen(false)
                setInput('')
            }
        } catch {
            toast.error('Có lỗi xảy ra khi nhập')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="size-4" />
                    Nhập từ Token
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nhập flashcard set</DialogTitle>
                    <DialogDescription>
                        Nhập danh sách mã Token hoặc link chia sẻ, mỗi mã một dòng.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="flashcard-import-token">Danh sách Token</Label>
                        <Textarea
                            id="flashcard-import-token"
                            placeholder={"token-1\ntoken-2\n..."}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            className="min-h-[150px] font-mono"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleImport} disabled={isLoading}>
                        {isLoading && <Loader2 className="size-4 animate-spin" />}
                        {isLoading ? 'Đang nhập...' : 'Nhập ngay'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
