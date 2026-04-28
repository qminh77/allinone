'use client'

import { useRef, useState } from 'react'
import type React from 'react'
import { useRouter } from 'next/navigation'
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { importFlashcardCards } from '@/lib/actions/flashcards'
import {
    parseFlashcardFile,
    parseFlashcardText,
    type FlashcardImportPreview,
} from '@/lib/client/flashcard-import'
import { downloadTextFile } from '@/lib/client/spreadsheet'

const sampleText = `Hello\tXin chào
Apple\tQuả táo
Good morning - Chào buổi sáng
Book;Quyển sách`

export function BulkImportFlashcardsDialog({ setId, onImported }: { setId: string; onImported?: () => void }) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [open, setOpen] = useState(false)
    const [input, setInput] = useState(sampleText)
    const [preview, setPreview] = useState<FlashcardImportPreview | null>(null)
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)

    function handleParseText() {
        const result = parseFlashcardText(input)
        setPreview(result)
        if (result.errors.length > 0) {
            toast.warning(`Có ${result.errors.length} dòng cần kiểm tra.`)
        }
    }

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.match(/\.(csv|txt|xlsx)$/i)) {
            toast.error('Chỉ hỗ trợ CSV, TXT hoặc Excel (.xlsx).')
            event.target.value = ''
            return
        }

        setIsParsing(true)
        try {
            const result = await parseFlashcardFile(file)
            setPreview(result)
            if (result.errors.length > 0) {
                toast.warning(`Có ${result.errors.length} dòng cần kiểm tra.`)
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không đọc được file.')
        } finally {
            setIsParsing(false)
            event.target.value = ''
        }
    }

    async function handleImport() {
        if (!preview || preview.cards.length === 0) {
            toast.error('Không có card hợp lệ để import.')
            return
        }

        if (preview.errors.length > 0) {
            toast.error('Vui lòng sửa lỗi format trước khi import.')
            return
        }

        setIsImporting(true)
        try {
            const result = await importFlashcardCards(setId, preview.cards)
            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success(`Đã import ${result.count} card`)
            setOpen(false)
            setPreview(null)
            onImported?.()
            router.refresh()
        } catch {
            toast.error('Không thể import dữ liệu')
        } finally {
            setIsImporting(false)
        }
    }

    function downloadSample() {
        downloadTextFile('flashcard_sample.txt', sampleText, 'text/plain;charset=utf-8')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <FileSpreadsheet className="size-4" />
                    Bulk import
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nhập hàng loạt flashcard</DialogTitle>
                    <DialogDescription>
                        Hỗ trợ paste text hoặc upload CSV, TXT, Excel (.xlsx). Format phổ biến: Term + delimiter + Definition.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="paste" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="paste">Paste text</TabsTrigger>
                        <TabsTrigger value="file">Upload file</TabsTrigger>
                    </TabsList>

                    <TabsContent value="paste" className="space-y-3">
                        <Textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            className="min-h-[180px] font-mono text-sm"
                            placeholder={"Hello\tXin chào\nApple\tQuả táo"}
                        />
                        <div className="flex flex-wrap justify-between gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={downloadSample}>
                                Tải mẫu TXT
                            </Button>
                            <Button type="button" onClick={handleParseText}>
                                Preview
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="file" className="space-y-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt,.xlsx"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-muted/30 p-8 text-sm transition-colors hover:bg-muted/50"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isParsing}
                        >
                            {isParsing ? <Loader2 className="size-8 animate-spin text-muted-foreground" /> : <Upload className="size-8 text-muted-foreground" />}
                            <span>{isParsing ? 'Đang đọc file...' : 'Chọn CSV, TXT hoặc Excel (.xlsx)'}</span>
                        </button>
                    </TabsContent>
                </Tabs>

                {preview && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={preview.errors.length === 0 ? 'secondary' : 'destructive'}>
                                {preview.cards.length} card hợp lệ
                            </Badge>
                            <Badge variant="outline">Delimiter: {preview.delimiter}</Badge>
                            {preview.errors.length > 0 && (
                                <Badge variant="destructive">{preview.errors.length} lỗi</Badge>
                            )}
                        </div>

                        {preview.errors.length > 0 && (
                            <div className="max-h-28 overflow-y-auto rounded-md border bg-destructive/5 p-3 text-sm text-destructive">
                                {preview.errors.slice(0, 8).map((error, index) => (
                                    <div key={index}>{error}</div>
                                ))}
                                {preview.errors.length > 8 && <div>...và {preview.errors.length - 8} lỗi khác</div>}
                            </div>
                        )}

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Term</TableHead>
                                    <TableHead>Definition</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {preview.cards.slice(0, 10).map((card, index) => (
                                    <TableRow key={`${card.term}-${index}`}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className="max-w-[180px] truncate">{card.term}</TableCell>
                                        <TableCell className="max-w-[320px] truncate">{card.definition}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {preview.cards.length > 10 && (
                            <p className="text-xs text-muted-foreground">Preview 10 card đầu tiên trong tổng số {preview.cards.length} card.</p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isImporting}>
                        Hủy
                    </Button>
                    <Button type="button" onClick={handleImport} disabled={!preview || preview.cards.length === 0 || preview.errors.length > 0 || isImporting}>
                        {isImporting && <Loader2 className="size-4 animate-spin" />}
                        Import {preview?.cards.length || 0} card
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
