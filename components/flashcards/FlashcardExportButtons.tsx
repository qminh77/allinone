'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getFlashcardSetExport } from '@/lib/actions/flashcards'
import { downloadTextFile } from '@/lib/client/spreadsheet'

export function FlashcardExportButtons({ setId }: { setId: string }) {
    const [loadingFormat, setLoadingFormat] = useState<'csv' | 'txt' | null>(null)

    async function handleExport(format: 'csv' | 'txt') {
        setLoadingFormat(format)
        try {
            const result = await getFlashcardSetExport(setId, format)
            if ('error' in result && result.error) {
                toast.error(result.error)
                return
            }

            if ('filename' in result && result.filename && typeof result.content === 'string' && result.mimeType) {
                downloadTextFile(result.filename, result.content, result.mimeType)
            }
        } catch {
            toast.error('Không thể export set này')
        } finally {
            setLoadingFormat(null)
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={!!loadingFormat}>
                {loadingFormat === 'csv' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                CSV
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleExport('txt')} disabled={!!loadingFormat}>
                {loadingFormat === 'txt' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                TXT
            </Button>
        </div>
    )
}
