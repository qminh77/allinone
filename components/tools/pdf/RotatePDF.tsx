'use client'

import { useState } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, RotateCw, RotateCcw, ArrowDown, X, Files } from 'lucide-react'
import { PDFDocument, degrees } from 'pdf-lib'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import JSZip from 'jszip'

interface RotatePdfProps {
    slug: string
    title: string
    description: string
}

export function RotatePDF({ slug, title, description }: RotatePdfProps) {
    const [files, setFiles] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [rotation, setRotation] = useState(0)

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

    const rotateLeft = () => setRotation(prev => (prev - 90) % 360)
    const rotateRight = () => setRotation(prev => (prev + 90) % 360)
    const rotate180 = () => setRotation(prev => (prev + 180) % 360)

    const handleRotate = async () => {
        if (files.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 file PDF.')
            return
        }

        setIsProcessing(true)
        try {
            if (files.length === 1) {
                const file = files[0]
                const arrayBuffer = await file.arrayBuffer()
                const pdfDoc = await PDFDocument.load(arrayBuffer)
                const pages = pdfDoc.getPages()

                pages.forEach(page => {
                    const currentRotation = page.getRotation().angle
                    page.setRotation(degrees(currentRotation + rotation))
                })

                const pdfBytes = await pdfDoc.save()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
                saveAs(blob, `rotated-${file.name}`)
                toast.success('Xoay PDF thành công!')
            } else {
                const zip = new JSZip()

                for (const file of files) {
                    const arrayBuffer = await file.arrayBuffer()
                    const pdfDoc = await PDFDocument.load(arrayBuffer)
                    const pages = pdfDoc.getPages()

                    pages.forEach(page => {
                        const currentRotation = page.getRotation().angle
                        page.setRotation(degrees(currentRotation + rotation))
                    })

                    const pdfBytes = await pdfDoc.save()
                    zip.file(`rotated-${file.name}`, pdfBytes)
                }

                const content = await zip.generateAsync({ type: 'blob' })
                saveAs(content, 'rotated-pdfs.zip')
                toast.success('Xoay file PDF và nén thành công!')
            }
        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra khi xoay file. Vui lòng thử lại.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <ToolShell title={title} description={description} icon={RotateCw}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Chọn file PDF</CardTitle>
                        <CardDescription>
                            Tải lên các file PDF bạn muốn xoay. Hỗ trợ xoay hàng loạt.
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
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removeFile(index)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Cài đặt Xoay</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-center items-center gap-4">
                            <Button variant={rotation === -90 ? "default" : "outline"} onClick={rotateLeft} className="gap-2">
                                <RotateCcw className="w-4 h-4" />
                                Trái 90°
                            </Button>
                            <Button variant={rotation === 90 ? "default" : "outline"} onClick={rotateRight} className="gap-2">
                                <RotateCw className="w-4 h-4" />
                                Phải 90°
                            </Button>
                            <Button variant={rotation === 180 ? "default" : "outline"} onClick={rotate180} className="gap-2">
                                <RotateCw className="w-4 h-4" />
                                180°
                            </Button>
                        </div>
                        <div className="text-center font-bold">
                            Góc xoay hiện tại: {rotation}°
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        size="lg"
                        onClick={handleRotate}
                        disabled={files.length === 0 || isProcessing || rotation === 0}
                        className="w-full md:w-auto"
                    >
                        {isProcessing ? 'Đang xử lý...' : 'Xoay PDF'}
                    </Button>
                </div>
            </div>
        </ToolShell>
    )
}
