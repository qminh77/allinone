'use client'

import { useState } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Upload, FileText, X, ArrowDown, Files } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'

interface MergePdfProps {
    slug: string
    title: string
    description: string
}

export function MergePDF({ slug, title, description }: MergePdfProps) { // Export as named export
    const [files, setFiles] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            const validFiles = newFiles.filter(file => file.type === 'application/pdf')

            if (validFiles.length !== newFiles.length) {
                toast.error('Chỉ chấp nhận file định dạng PDF!')
            }

            setFiles(prev => [...prev, ...validFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const moveFile = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === files.length - 1)
        ) {
            return
        }

        const newFiles = [...files]
        const swapIndex = direction === 'up' ? index - 1 : index + 1
            ;[newFiles[index], newFiles[swapIndex]] = [newFiles[swapIndex], newFiles[index]]
        setFiles(newFiles)
    }

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error('Vui lòng chọn ít nhất 2 file PDF để ghép.')
            return
        }

        setIsProcessing(true)
        try {
            const mergedPdf = await PDFDocument.create()

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer()
                const pdf = await PDFDocument.load(arrayBuffer)
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
                copiedPages.forEach((page) => mergedPdf.addPage(page))
            }

            const pdfBytes = await mergedPdf.save()
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            saveAs(blob, 'merged-document.pdf')
            toast.success('Ghép PDF thành công!')

            // Optional: reset files
            // setFiles([]) 
        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra khi ghép file. Vui lòng thử lại.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <ToolShell title={title} description={description} icon={Files}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Chọn file PDF</CardTitle>
                        <CardDescription>
                            Tải lên các file PDF bạn muốn ghép nối. Bạn có thể sắp xếp lại vị trí của chúng.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="pdf-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors w-full h-32 flex-col gap-2"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm font-medium">Nhấn để tải lên file PDF</span>
                                <input
                                    id="pdf-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf"
                                    multiple
                                    onChange={handleFileChange}
                                />
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                {files.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách file ({files.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex flex-col items-center justify-center w-8 h-8 bg-primary/10 rounded">
                                            <span className="text-xs font-bold">{index + 1}</span>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <span className="text-sm font-medium truncate max-w-[300px]">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => moveFile(index, 'up')}
                                            disabled={index === 0}
                                        >
                                            <ArrowDown className="w-4 h-4 rotate-180" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => moveFile(index, 'down')}
                                            disabled={index === files.length - 1}
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => removeFile(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end">
                    <Button
                        size="lg"
                        onClick={handleMerge}
                        disabled={files.length < 2 || isProcessing}
                        className="w-full md:w-auto"
                    >
                        {isProcessing ? 'Đang xử lý...' : 'Ghép PDF'}
                    </Button>
                </div>
            </div>
        </ToolShell>
    )
}
