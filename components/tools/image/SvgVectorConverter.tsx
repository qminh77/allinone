'use client'

import { useState } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, Zap } from 'lucide-react'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import JSZip from 'jszip'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import ImageTracer from 'imagetracerjs'

interface SvgVectorConverterProps {
    slug: string
    title: string
    description: string
}

export function SvgVectorConverter({ slug, title, description }: SvgVectorConverterProps) {
    const [files, setFiles] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const convertFile = async (file: File): Promise<{ content: string, name: string }> => {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file)

            // Default options for better quality
            const options = {
                corsenabled: false,
                ltres: 1,
                qtres: 1,
                pathomit: 8,
                rightangleenhance: true,
                colorsampling: 2,
                numberofcolors: 16,
                mincolorratio: 0.02,
                colorquantcycles: 3,
                scale: 1,
                simplify: 0,
                roundcoords: 1,
                lcpr: 0,
                qcpr: 0,
                desc: false,
                viewbox: false,
                blurradius: 0,
                blurdelta: 20
            }

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (ImageTracer as any).imageToSVG(url, (svgstr: string) => {
                    URL.revokeObjectURL(url)
                    const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
                    resolve({ content: svgstr, name: `${fileNameWithoutExt}.svg` })
                }, options)
            } catch (error) {
                URL.revokeObjectURL(url)
                reject(error)
            }
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
                const { content, name } = await convertFile(files[0])
                const blob = new Blob([content], { type: 'image/svg+xml' })
                saveAs(blob, name)
                toast.success('Vector hóa thành công!')
            } else {
                const zip = new JSZip()

                for (const file of files) {
                    try {
                        const { content, name } = await convertFile(file)
                        zip.file(name, content)
                    } catch (err) {
                        console.error(`Failed to convert ${file.name}`, err)
                        toast.error(`Lỗi khi chuyển đổi ${file.name}`)
                    }
                }

                const content = await zip.generateAsync({ type: 'blob' })
                saveAs(content, `converted-vectors.zip`)
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
        <ToolShell title={title} description={description} icon={Zap}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Chọn ảnh PNG/JPG để Vector hóa</CardTitle>
                        <CardDescription>
                            Chuyển đổi ảnh raster (PNG, JPG) thành vector SVG. Thích hợp cho logo, biểu tượng đơn giản.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="vector-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors w-full h-32 flex-col gap-2"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm font-medium">Nhấn để tải lên ảnh (PNG, JPG)</span>
                                <input
                                    id="vector-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/png,image/jpeg"
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
                        {isProcessing ? 'Đang xử lý...' : 'Chuyển đổi sang SVG'}
                    </Button>
                </div>
            </div>
        </ToolShell>
    )
}
