'use client'

import { useState, type ChangeEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Copy, Download, FileCode, Trash, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { saveToolOutput } from '@/lib/client/tool-files'
import { convertLatex, getLatexTargetFormat, type LatexConversionResult } from '@/lib/client/latex-converter'

interface LatexConverterProps {
    slug: string
    title: string
    description: string
}

export function LatexConverter({ slug, title, description }: LatexConverterProps) {
    const [inputContent, setInputContent] = useState('')
    const [conversion, setConversion] = useState<LatexConversionResult | null>(null)
    const [fileName, setFileName] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isDownloading, setIsDownloading] = useState(false)

    const targetFormat = getLatexTargetFormat(slug)
    const outputContent = conversion?.content || ''

    const processConversion = (content: string, sourceName = fileName) => {
        if (!content.trim()) {
            setConversion(null)
            setErrorMessage('')
            return
        }

        try {
            setConversion(convertLatex(content, slug, { sourceName }))
            setErrorMessage('')
        } catch (error) {
            console.error(error)
            setConversion(null)
            setErrorMessage(error instanceof Error ? error.message : 'Không thể chuyển đổi LaTeX hiện tại.')
        }
    }

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!/\.(tex|latex|ltx|txt)$/i.test(file.name)) {
            toast.error('Vui lòng tải lên file LaTeX (.tex, .latex, .ltx, .txt)')
            event.target.value = ''
            return
        }

        try {
            const content = await file.text()
            setInputContent(content)
            setFileName(file.name)
            processConversion(content, file.name)
        } catch (error) {
            console.error(error)
            toast.error('Không đọc được file LaTeX.')
        } finally {
            event.target.value = ''
        }
    }

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const value = event.target.value
        setInputContent(value)
        processConversion(value)
    }

    const clearInput = () => {
        setInputContent('')
        setFileName('')
        setConversion(null)
        setErrorMessage('')
    }

    const copyToClipboard = async () => {
        if (!outputContent) return

        try {
            await navigator.clipboard.writeText(outputContent)
            toast.success('Đã sao chép vào clipboard')
        } catch {
            toast.error('Không thể sao chép vào clipboard.')
        }
    }

    const downloadResult = async () => {
        if (!conversion || !outputContent) return

        setIsDownloading(true)
        try {
            const blob = await createDownloadBlob(conversion)
            await saveToolOutput({
                moduleKey: slug,
                blob,
                filename: buildOutputFilename(fileName, conversion),
                mimeType: conversion.mimeType,
            })
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Không thể tạo file tải xuống.')
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <ToolShell title={title} description={description} icon={FileCode}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Input LaTeX</CardTitle>
                        <CardDescription>
                            Nhập mã LaTeX hoặc tải file .tex. Công cụ nhận diện bảng `tabular`, `array`, `longtable` và vẫn xử lý được nội dung văn bản thường.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Label
                                htmlFor="latex-upload"
                                className="flex w-fit cursor-pointer items-center justify-center rounded-md border border-dashed px-4 py-2 transition-colors hover:bg-muted/50"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                <span>Upload File</span>
                                <input
                                    id="latex-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".tex,.latex,.ltx,.txt"
                                    onChange={handleFileUpload}
                                />
                            </Label>
                            {fileName && <span className="text-sm text-green-600">File: {fileName}</span>}
                            <Button variant="ghost" size="sm" className="w-fit" onClick={clearInput} disabled={!inputContent && !fileName}>
                                <Trash className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        </div>
                        <Textarea
                            placeholder={`\\begin{tabular}{ |c|c| }\n\\hline\nID & Name \\\\\n1 & John \\\\\n2 & Jane \\\\\n\\hline\n\\end{tabular}`}
                            className="min-h-[220px] font-mono text-sm whitespace-pre"
                            value={inputContent}
                            onChange={handleInputChange}
                        />
                        {conversion && (
                            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                                <div>{conversion.summary}</div>
                                {conversion.warning && <div className="mt-1">{conversion.warning}</div>}
                            </div>
                        )}
                        {errorMessage && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {errorMessage}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle>2. Kết quả ({targetFormat.toUpperCase()})</CardTitle>
                            <CardDescription>
                                Xem trước và tải xuống kết quả{conversion ? ` .${conversion.extension}` : ''}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!outputContent || isDownloading}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                            </Button>
                            <Button size="sm" onClick={downloadResult} disabled={!outputContent || isDownloading}>
                                <Download className="mr-2 h-4 w-4" />
                                {isDownloading ? 'Đang tạo...' : 'Download'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Kết quả chuyển đổi sẽ xuất hiện ở đây..."
                            className="min-h-[320px] font-mono text-sm"
                            value={outputContent}
                            readOnly
                        />
                    </CardContent>
                </Card>
            </div>
        </ToolShell>
    )
}

async function createDownloadBlob(conversion: LatexConversionResult) {
    if (conversion.downloadKind === 'pdf') {
        return renderTextPdfBlob(conversion.content)
    }

    if (conversion.downloadKind === 'png' || conversion.downloadKind === 'jpeg') {
        return renderTextImageBlob(conversion.content, conversion.mimeType)
    }

    return new Blob([conversion.content], { type: conversion.mimeType })
}

function buildOutputFilename(inputName: string, conversion: LatexConversionResult) {
    const baseName = inputName ? inputName.replace(/\.[^.]+$/, '') : 'converted-latex'
    const safeName = baseName.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'converted-latex'
    return `${safeName}.${conversion.extension}`
}

async function renderTextImageBlob(content: string, mimeType: string) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không thể tạo canvas để render ảnh.')

    const width = 1400
    const padding = 48
    const lineHeight = 30
    const maxHeight = 16000
    context.font = getCanvasFont()
    const wrappedLines = wrapTextLines(context, content, width - padding * 2)
    const maxLines = Math.max(1, Math.floor((maxHeight - padding * 2) / lineHeight) - 1)
    const visibleLines = wrappedLines.length > maxLines
        ? [...wrappedLines.slice(0, maxLines), `... Đã rút gọn ${wrappedLines.length - maxLines} dòng do giới hạn canvas của trình duyệt.`]
        : wrappedLines

    canvas.width = width
    canvas.height = Math.max(260, padding * 2 + visibleLines.length * lineHeight)
    drawTextCanvas(context, canvas.width, canvas.height, visibleLines, padding, lineHeight)

    return canvasToBlob(canvas, mimeType, mimeType === 'image/jpeg' ? 0.92 : undefined)
}

async function renderTextPdfBlob(content: string) {
    const { PDFDocument } = await import('pdf-lib')
    const pdf = await PDFDocument.create()
    const pageWidth = 595.28
    const pageHeight = 841.89
    const scale = 2
    const canvasWidth = Math.round(pageWidth * scale)
    const canvasHeight = Math.round(pageHeight * scale)
    const padding = 72
    const lineHeight = 28
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không thể tạo canvas để render PDF.')

    canvas.width = canvasWidth
    canvas.height = canvasHeight
    context.font = getCanvasFont()
    const lines = wrapTextLines(context, content, canvasWidth - padding * 2)
    const linesPerPage = Math.max(1, Math.floor((canvasHeight - padding * 2 - lineHeight) / lineHeight))
    const totalPages = Math.max(1, Math.ceil(lines.length / linesPerPage))

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const pageLines = lines.slice(pageIndex * linesPerPage, (pageIndex + 1) * linesPerPage)
        drawTextCanvas(context, canvasWidth, canvasHeight, pageLines, padding, lineHeight, `${pageIndex + 1}/${totalPages}`)
        const pngBlob = await canvasToBlob(canvas, 'image/png')
        const image = await pdf.embedPng(await pngBlob.arrayBuffer())
        const page = pdf.addPage([pageWidth, pageHeight])
        page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight })
    }

    const bytes = await pdf.save()
    const pdfBuffer = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(pdfBuffer).set(bytes)

    return new Blob([pdfBuffer], { type: 'application/pdf' })
}

function getCanvasFont() {
    return '24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
}

function drawTextCanvas(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    lines: string[],
    padding: number,
    lineHeight: number,
    footer?: string
) {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.fillStyle = '#111827'
    context.font = getCanvasFont()
    context.textBaseline = 'top'

    lines.forEach((line, index) => {
        context.fillText(line || ' ', padding, padding + index * lineHeight)
    })

    if (footer) {
        context.fillStyle = '#6b7280'
        context.font = '20px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        context.fillText(footer, width - padding - context.measureText(footer).width, height - padding + 12)
    }
}

function wrapTextLines(context: CanvasRenderingContext2D, content: string, maxWidth: number) {
    const lines: string[] = []

    for (const paragraph of content.split('\n')) {
        if (!paragraph.trim()) {
            lines.push('')
            continue
        }

        let currentLine = ''
        for (const word of paragraph.split(/\s+/)) {
            const candidate = currentLine ? `${currentLine} ${word}` : word
            if (context.measureText(candidate).width <= maxWidth) {
                currentLine = candidate
                continue
            }

            if (currentLine) lines.push(currentLine)
            currentLine = word

            while (context.measureText(currentLine).width > maxWidth && currentLine.length > 1) {
                let splitAt = currentLine.length - 1
                while (splitAt > 1 && context.measureText(currentLine.slice(0, splitAt)).width > maxWidth) {
                    splitAt--
                }
                lines.push(currentLine.slice(0, splitAt))
                currentLine = currentLine.slice(splitAt)
            }
        }

        lines.push(currentLine)
    }

    return lines.length > 0 ? lines : ['']
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Không thể tạo file từ canvas.'))
        }, mimeType, quality)
    })
}
