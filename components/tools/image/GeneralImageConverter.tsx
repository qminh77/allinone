'use client'

import { useState } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, ArrowDown, Image as ImageIcon } from 'lucide-react'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import JSZip from 'jszip'

interface GeneralImageConverterProps {
    slug: string
    title: string
    description: string
}

type TargetFormat = 'image/png' | 'image/jpeg'

const getTargetExtension = (format: TargetFormat) => {
    return format === 'image/png' ? 'png' : 'jpg'
}

const getTargetFormatFromSlug = (slug: string): TargetFormat => {
    if (slug.endsWith('to-jpg')) return 'image/jpeg'
    return 'image/png' // Default to PNG
}

export function GeneralImageConverter({ slug, title, description }: GeneralImageConverterProps) {
    const [files, setFiles] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    // Determine target format based on slug
    const targetFormat = getTargetFormatFromSlug(slug)
    const targetExtension = getTargetExtension(targetFormat)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            // Filter logic can be more specific if needed, but for now allow typical extensions
            // This component handles WebP, JFIF, SVG input via Canvas
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const convertFile = async (file: File): Promise<{ blob: Blob, name: string }> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const url = URL.createObjectURL(file)

            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')

                if (ctx) {
                    // For JPEG, fill background with white (since JPEG doesn't support transparency)
                    if (targetFormat === 'image/jpeg') {
                        ctx.fillStyle = '#FFFFFF'
                        ctx.fillRect(0, 0, canvas.width, canvas.height)
                    }
                    ctx.drawImage(img, 0, 0)

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
                            resolve({ blob, name: `${fileNameWithoutExt}.${targetExtension}` })
                        } else {
                            reject(new Error('Conversion failed'))
                        }
                        URL.revokeObjectURL(url)
                    }, targetFormat, 0.9)
                } else {
                    reject(new Error('Canvas context not found'))
                    URL.revokeObjectURL(url)
                }
            }

            img.onerror = () => {
                reject(new Error('Could not load image'))
                URL.revokeObjectURL(url)
            }

            img.src = url
        })
    }

    const handleConvert = async () => {
        if (files.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 file.')
            return
        }

        setIsProcessing(true)
        try {
            if (files.length === 1) {
                const { blob, name } = await convertFile(files[0])
                saveAs(blob, name)
                toast.success('Chuyển đổi thành công!')
            } else {
                const zip = new JSZip()

                for (const file of files) {
                    try {
                        const { blob, name } = await convertFile(file)
                        zip.file(name, blob)
                    } catch (err) {
                        console.error(`Failed to convert ${file.name}`, err)
                        toast.error(`Lỗi khi chuyển đổi ${file.name}`)
                    }
                }

                const content = await zip.generateAsync({ type: 'blob' })
                saveAs(content, `converted-images.zip`)
                toast.success('Chuyển đổi hàng loạt thành công!')
            }
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
                        <CardTitle>Chọn ảnh để chuyển đổi</CardTitle>
                        <CardDescription>
                            Tải lên các file ảnh (WEBP, JFIF, SVG...). Hỗ trợ chuyển đổi hàng loạt sang {targetExtension.toUpperCase()}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="image-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors w-full h-32 flex-col gap-2"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm font-medium">Nhấn để tải lên ảnh</span>
                                <input
                                    id="image-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/webp,image/jpeg,image/svg+xml"
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

                <div className="flex justify-end">
                    <Button
                        size="lg"
                        onClick={handleConvert}
                        disabled={files.length === 0 || isProcessing}
                        className="w-full md:w-auto"
                    >
                        {isProcessing ? 'Đang xử lý...' : `Chuyển đổi sang ${targetExtension.toUpperCase()}`}
                    </Button>
                </div>
            </div>
        </ToolShell>
    )
}
