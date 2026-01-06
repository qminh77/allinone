'use client'

import { useState, useRef, useEffect } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, Image as ImageIcon, Download } from 'lucide-react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { toast } from 'sonner'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker source to CDN to avoid build issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

interface PdfToImageProps {
    slug: string
    title: string
    description: string
}

export function PDFToImage({ slug, title, description }: PdfToImageProps) {
    const [file, setFile] = useState<File | null>(null)
    const [pageCount, setPageCount] = useState<number>(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Chỉ chấp nhận file định dạng PDF!')
                return
            }
            setFile(selectedFile)
            setIsProcessing(true)
            try {
                const arrayBuffer = await selectedFile.arrayBuffer()
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
                setPageCount(pdf.numPages)
                toast.success(`Đã tải PDF với ${pdf.numPages} trang.`)
            } catch (error) {
                console.error(error)
                toast.error('Lỗi đọc file PDF.')
            } finally {
                setIsProcessing(false)
            }
        }
    }

    const handleConvert = async () => {
        if (!file) return

        setIsProcessing(true)
        try {
            const arrayBuffer = await file.arrayBuffer()
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
            const zip = new JSZip()
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')

            if (!context) {
                throw new Error('Canvas context not found')
            }

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i)
                const viewport = page.getViewport({ scale: 2.0 }) // High quality
                canvas.height = viewport.height
                canvas.width = viewport.width

                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                    // @ts-ignore
                    canvas: canvas
                }).promise

                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
                if (blob) {
                    zip.file(`page_${i}.png`, blob)
                }
            }

            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `${file.name.replace('.pdf', '')}_images.zip`)
            toast.success('Đã chuyển đổi và tải xuống thành công!')

        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra khi chuyển đổi.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <ToolShell title={title} description={description} icon={ImageIcon}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Tải lên file PDF</CardTitle>
                        <CardDescription>File sẽ được chuyển đổi thành các ảnh PNG (chất lượng cao) và nén thành file ZIP.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="pdf-image-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors w-full h-32 flex-col gap-2"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm font-medium">
                                    {file ? file.name : 'Nhấn để tải lên file PDF'}
                                </span>
                                {pageCount > 0 && <span className="text-xs text-green-600">({pageCount} trang)</span>}
                                <input
                                    id="pdf-image-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                />
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleConvert} disabled={!file || isProcessing} size="lg">
                        {isProcessing ? 'Đang xử lý...' : 'Chuyển đổi sang Ảnh'}
                    </Button>
                </div>
            </div>
            {/* Hidden canvas for processing if needed explicitly, but document.createElement is used in logic */}
        </ToolShell>
    )
}
