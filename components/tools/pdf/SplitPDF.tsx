'use client'

import { useState } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Upload, Scissors, Download, FileText } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { toast } from 'sonner'

interface SplitPdfProps {
    slug: string
    title: string
    description: string
}

export function SplitPDF({ slug, title, description }: SplitPdfProps) {
    const [file, setFile] = useState<File | null>(null)
    const [pageCount, setPageCount] = useState<number>(0)
    const [splitMode, setSplitMode] = useState<'all' | 'range'>('all')
    const [range, setRange] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Chỉ chấp nhận file định dạng PDF!')
                return
            }
            setFile(selectedFile)

            try {
                const arrayBuffer = await selectedFile.arrayBuffer()
                const pdf = await PDFDocument.load(arrayBuffer)
                setPageCount(pdf.getPageCount())
            } catch (error) {
                console.error(error)
                toast.error('Không thể đọc file PDF.')
            }
        }
    }

    const parseRange = (rangeStr: string, maxPages: number): number[] => {
        const pages = new Set<number>()
        const parts = rangeStr.split(',')

        for (const part of parts) {
            const trimmed = part.trim()
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(Number)
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= maxPages) pages.add(i - 1) // 0-indexed
                    }
                }
            } else {
                const page = Number(trimmed)
                if (!isNaN(page) && page >= 1 && page <= maxPages) {
                    pages.add(page - 1)
                }
            }
        }
        return Array.from(pages).sort((a, b) => a - b)
    }

    const handleSplit = async () => {
        if (!file) return

        setIsProcessing(true)
        try {
            const arrayBuffer = await file.arrayBuffer()
            const sourcePdf = await PDFDocument.load(arrayBuffer)

            if (splitMode === 'all') {
                const zip = new JSZip()

                for (let i = 0; i < sourcePdf.getPageCount(); i++) {
                    const newPdf = await PDFDocument.create()
                    const [copiedPage] = await newPdf.copyPages(sourcePdf, [i])
                    newPdf.addPage(copiedPage)
                    const pdfBytes = await newPdf.save()
                    zip.file(`${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`, pdfBytes)
                }

                const content = await zip.generateAsync({ type: 'blob' })
                saveAs(content, `${file.name.replace('.pdf', '')}_split.zip`)
                toast.success('Đã chia file và tải xuống!')
            } else {
                const selectedPages = parseRange(range, pageCount)
                if (selectedPages.length === 0) {
                    toast.error('Vui lòng nhập khoảng trang hợp lệ (VD: 1-3, 5)')
                    setIsProcessing(false)
                    return
                }

                const newPdf = await PDFDocument.create()
                const copiedPages = await newPdf.copyPages(sourcePdf, selectedPages)
                copiedPages.forEach(page => newPdf.addPage(page))

                const pdfBytes = await newPdf.save()
                const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
                saveAs(blob, `${file.name.replace('.pdf', '')}_split_custom.pdf`)
                toast.success('Đã trích xuất file thành công!')
            }
        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra khi xử lý file.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <ToolShell title={title} description={description} icon={Scissors}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Tải lên file PDF</CardTitle>
                        <CardDescription>Chọn file PDF bạn muốn chia nhỏ hoặc trích xuất trang.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="pdf-split-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors w-full h-32 flex-col gap-2"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm font-medium">
                                    {file ? file.name : 'Nhấn để tải lên file PDF'}
                                </span>
                                {pageCount > 0 && <span className="text-xs text-green-600">({pageCount} trang)</span>}
                                <input
                                    id="pdf-split-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                />
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                {file && (
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Tùy chọn chia file</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <RadioGroup value={splitMode} onValueChange={(v: string) => setSplitMode(v as 'all' | 'range')}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="all" />
                                    <Label htmlFor="all">Chia tất cả các trang thành các file riêng lẻ (Download ZIP)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="range" id="range" />
                                    <Label htmlFor="range">Trích xuất các trang cụ thể (Gộp thành 1 file PDF mới)</Label>
                                </div>
                            </RadioGroup>

                            {splitMode === 'range' && (
                                <div className="ml-6 space-y-2">
                                    <Label htmlFor="range-input">Nhập trang hoặc khoảng trang (Ví dụ: 1-3, 5, 8-10)</Label>
                                    <Input
                                        id="range-input"
                                        placeholder="1-5, 8, 11-13"
                                        value={range}
                                        onChange={(e) => setRange(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="pt-4">
                                <Button onClick={handleSplit} disabled={isProcessing}>
                                    {isProcessing ? 'Đang xử lý...' : (splitMode === 'all' ? 'Chia & Tải ZIP' : 'Trích xuất PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ToolShell>
    )
}
