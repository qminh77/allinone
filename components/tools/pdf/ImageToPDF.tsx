'use client'

import { useState } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, FileDown, Trash, ArrowDown, X } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'

interface ImageToPdfProps {
    slug: string
    title: string
    description: string
}

export function ImageToPDF({ slug, title, description }: ImageToPdfProps) {
    const [files, setFiles] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            const validFiles = newFiles.filter(file => file.type.startsWith('image/'))

            if (validFiles.length !== newFiles.length) {
                toast.error('Chỉ chấp nhận file định dạng ảnh (JPG, PNG)!')
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

    const handleConvert = async () => {
        if (files.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 ảnh.')
            return
        }

        setIsProcessing(true)
        try {
            const pdfDoc = await PDFDocument.create()

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer()
                const imageBytes = arrayBuffer

                let image
                if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                    image = await pdfDoc.embedJpg(imageBytes)
                } else if (file.type === 'image/png') {
                    image = await pdfDoc.embedPng(imageBytes)
                } else {
                    // Try to fallback or skip
                    console.warn(`Unsupported image type: ${file.type}`)
                    continue
                }

                const page = pdfDoc.addPage([image.width, image.height])
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                })
            }

            const pdfBytes = await pdfDoc.save()
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            saveAs(blob, 'images-converted.pdf')
            toast.success('Chuyển đổi ảnh sang PDF thành công!')
        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra khi chuyển đổi (có thể do định dạng ảnh không hỗ trợ).')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <ToolShell title={title} description={description} icon={FileDown}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Tải lên hình ảnh</CardTitle>
                        <CardDescription>Chọn các file ảnh (JPG, PNG) để ghép thành file PDF.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="image-pdf-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors w-full h-32 flex-col gap-2"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm font-medium">Nhấn để tải lên ảnh</span>
                                <input
                                    id="image-pdf-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/jpg"
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
                            <CardTitle>Danh sách ảnh ({files.length})</CardTitle>
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
                    <Button onClick={handleConvert} disabled={files.length === 0 || isProcessing} size="lg">
                        {isProcessing ? 'Đang xử lý...' : 'Chuyển đổi sang PDF'}
                    </Button>
                </div>
            </div>
        </ToolShell>
    )
}
