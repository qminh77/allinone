'use client'

import { useState, useEffect, useRef } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, Image as ImageIcon, Loader2, Download } from 'lucide-react'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import JSZip from 'jszip'
import {
    initializeImageMagick,
    ImageMagick,
    MagickFormat
} from '@imagemagick/magick-wasm'

interface UniversalImageConverterProps {
    slug: string
    title: string
    description: string
}

const WASM_URL = '/magick.wasm'

export function UniversalImageConverter({ slug, title, description }: UniversalImageConverterProps) {
    const [files, setFiles] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [targetFormat, setTargetFormat] = useState('png')
    const [isInitializing, setIsInitializing] = useState(true)
    const isInitializedRef = useRef(false)

    useEffect(() => {
        const init = async () => {
            if (isInitializedRef.current) {
                setIsInitializing(false)
                return
            }

            try {
                // Check if already initialized globally (if multiple instances)
                // But initializeImageMagick usually handles idempotency or we should safeguard
                await initializeImageMagick(new URL(WASM_URL, window.location.origin))
                isInitializedRef.current = true
                console.log('Magick WASM initialized')
            } catch (error) {
                console.error('Failed to initialize Magick WASM:', error)
                // Assuming it might have been initialized by another component instance or previously
                // If it fails because "already initialized", we proceed.
                // But strict check is hard without internal API. 
                // We'll assume success for now or check error message.
                if ((error as Error).message?.includes('already')) {
                    isInitializedRef.current = true
                } else {
                    toast.error('Không thể khởi động bộ xử lý ảnh. Vui lòng tải lại trang.')
                }
            } finally {
                setIsInitializing(false)
            }
        }

        init()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const convertFile = async (file: File): Promise<{ blob: Blob, name: string }> => {
        return new Promise(async (resolve, reject) => {
            try {
                const arrayBuffer = await file.arrayBuffer()
                const uint8Array = new Uint8Array(arrayBuffer)

                ImageMagick.read(uint8Array, (image) => {
                    let format: MagickFormat = MagickFormat.Png
                    let mime = 'image/png'

                    switch (targetFormat) {
                        case 'jpg':
                        case 'jpeg':
                            format = MagickFormat.Jpeg
                            mime = 'image/jpeg'
                            break
                        case 'webp':
                            format = MagickFormat.WebP
                            mime = 'image/webp'
                            break
                        case 'ico':
                            format = MagickFormat.Ico
                            mime = 'image/x-icon'
                            break
                        case 'bmp':
                            format = MagickFormat.Bmp
                            mime = 'image/bmp'
                            break
                        case 'gif':
                            format = MagickFormat.Gif
                            mime = 'image/gif'
                            break
                        case 'tiff':
                            format = MagickFormat.Tiff
                            mime = 'image/tiff'
                            break
                        case 'psd':
                            format = MagickFormat.Psd
                            mime = 'image/vnd.adobe.photoshop'
                            break
                        case 'pdf':
                            format = MagickFormat.Pdf
                            mime = 'application/pdf'
                            break
                        case 'tga':
                            format = MagickFormat.Tga
                            mime = 'image/x-tga'
                            break
                        case 'dds':
                            format = MagickFormat.Dds
                            mime = 'image/vnd.ms-dds'
                            break
                    }

                    image.write(format, (data) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const blob = new Blob([data as any], { type: mime })
                        const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
                        resolve({ blob, name: `${fileNameWithoutExt}.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}` })
                    })
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    const handleConvert = async () => {
        if (files.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 file.')
            return
        }

        if (!isInitializedRef.current) {
            toast.error('Bộ xử lý chưa sẵn sàng. Vui lòng đợi hoặc tải lại trang.')
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
            toast.error('Có lỗi xảy ra khi chuyển đổi (Định dạng có thể không được hỗ trợ).')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <ToolShell title={title} description={description} icon={ImageIcon}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Công cụ chuyển đổi ảnh đa năng</CardTitle>
                        <CardDescription>
                            Hỗ trợ hơn 80 định dạng ảnh (RAW, PSD, TIFF...). Chuyển đổi sang PNG chất lượng cao ngay trên trình duyệt.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isInitializing && (
                            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang khởi động bộ xử lý ảnh (WASM)...
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <div className="w-full md:w-1/3">
                                <Label>Định dạng đầu ra</Label>
                                <Select value={targetFormat} onValueChange={setTargetFormat}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn định dạng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="png">PNG (Chất lượng cao - Mặc định)</SelectItem>
                                        <SelectItem value="jpg">JPG (Ảnh nén - Nhẹ hơn)</SelectItem>
                                        <SelectItem value="webp">WEBP (Cho Web)</SelectItem>
                                        <SelectItem value="ico">ICO (Icon)</SelectItem>
                                        <SelectItem value="bmp">BMP (Bitmap - Không nén)</SelectItem>
                                        <SelectItem value="gif">GIF (Ảnh động)</SelectItem>
                                        <SelectItem value="tiff">TIFF (In ấn)</SelectItem>
                                        <SelectItem value="psd">PSD (Photoshop)</SelectItem>
                                        <SelectItem value="pdf">PDF (Tài liệu)</SelectItem>
                                        <SelectItem value="tga">TGA (Game Textures)</SelectItem>
                                        <SelectItem value="dds">DDS (DirectDraw Surface)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="univ-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors w-full h-32 flex-col gap-2"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm font-medium">Nhấn để tải lên file (Mọi định dạng)</span>
                                <input
                                    id="univ-upload"
                                    type="file"
                                    className="hidden"
                                    multiple
                                    onChange={handleFileChange}
                                    disabled={isInitializing}
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
                        disabled={files.length === 0 || isProcessing || isInitializing}
                        className="w-full md:w-auto"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Chuyển đổi sang {targetFormat.toUpperCase()}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </ToolShell>
    )
}
