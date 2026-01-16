'use client'

import { useState, useEffect, useRef } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, Video, Loader2, Download } from 'lucide-react'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

interface UniversalVideoConverterProps {
    slug: string
    title: string
    description: string
}

type VideoFormat = 'mp4' | 'avi' | 'mkv' | 'mov' | 'wmv' | 'flv' | 'webm' | 'm4v' | 'mpeg' | '3gp' | 'gif'

export function UniversalVideoConverter({ slug, title, description }: UniversalVideoConverterProps) {
    const [files, setFiles] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [targetFormat, setTargetFormat] = useState<VideoFormat>('mp4')
    const [isLoaded, setIsLoaded] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const ffmpegRef = useRef<FFmpeg | null>(null)
    const loadRef = useRef(false)

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        if (loadRef.current) return
        loadRef.current = true

        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg()
        }

        const ffmpeg = ffmpegRef.current

        ffmpeg.on('log', ({ message }) => {
            console.log(message)
            if (message.includes('Doing')) {
                setStatusMessage('Đang xử lý video... (Quá trình này có thể mất thời gian tùy thuộc vào độ lớn file)')
            }
        })

        try {
            const baseURL = `${window.location.origin}/ffmpeg`
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            })
            setIsLoaded(true)
            console.log('FFmpeg loaded')
        } catch (error) {
            console.error('Failed to load FFmpeg:', error)
            toast.error('Không thể tải bộ xử lý video. Vui lòng thử lại.')
        }
    }

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
        const ffmpeg = ffmpegRef.current
        if (!ffmpeg) throw new Error('FFmpeg not initialized')

        const fileName = file.name
        const safeName = 'input_' + Date.now() + fileName.substring(fileName.lastIndexOf('.'))

        try {
            await ffmpeg.writeFile(safeName, await fetchFile(file))

            const outName = `output.${targetFormat}`

            // Video conversion could be heavy, so we might want to scale down or use presets if needed.
            // For now, let's try direct conversion.
            // Note: WASM has memory limits. 
            await ffmpeg.exec(['-i', safeName, outName])

            const data = await ffmpeg.readFile(outName)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([data as any], { type: `video/${targetFormat === 'mkv' ? 'x-matroska' : targetFormat}` })

            // Clean up
            await ffmpeg.deleteFile(safeName)
            await ffmpeg.deleteFile(outName)

            const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
            return { blob, name: `${fileNameWithoutExt}.${targetFormat}` }
        } catch (error) {
            throw error
        }
    }

    // Helper to read file as Uint8Array
    const fetchFile = (file: File): Promise<Uint8Array> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) {
                    resolve(new Uint8Array(reader.result))
                } else {
                    reject(new Error('Failed to read file'))
                }
            }
            reader.onerror = reject
            reader.readAsArrayBuffer(file)
        })
    }

    const handleConvert = async () => {
        if (files.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 file.')
            return
        }

        setIsProcessing(true)
        setStatusMessage('Đang chuẩn bị...')

        try {
            if (files.length === 1) {
                const { blob, name } = await convertFile(files[0])
                saveAs(blob, name)
                toast.success('Chuyển đổi thành công!')
            } else {
                const zip = new JSZip()
                let successCount = 0

                for (const file of files) {
                    try {
                        const { blob, name } = await convertFile(file)
                        zip.file(name, blob)
                        successCount++
                    } catch (err) {
                        console.error(`Failed to convert ${file.name}`, err)
                        toast.error(`Lỗi khi chuyển đổi ${file.name}: ${(err as Error).message}`)
                    }
                }

                if (successCount > 0) {
                    const content = await zip.generateAsync({ type: 'blob' })
                    saveAs(content, `converted-videos.zip`)
                    toast.success(`Đã chuyển đổi thành công ${successCount}/${files.length} file!`)
                }
            }
        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra khi chuyển đổi. Lưu ý: File quá lớn có thể gây lỗi bộ nhớ.')
        } finally {
            setIsProcessing(false)
            setStatusMessage('')
        }
    }

    return (
        <ToolShell title={title} description={description} icon={Video}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Công cụ chuyển đổi Video Đa năng
                            {isLoaded ? (
                                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">Sẵn sàng</span>
                            ) : (
                                <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20 flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Đang tải bộ xử lý...
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Chuyển đổi qua lại giữa hơn 30 định dạng video (MP4, AVI, MKV, MOV, GIF...).
                            <br />
                            <span className="text-xs text-muted-foreground">
                                * Chạy trực tiếp trên trình duyệt. Lưu ý: Xử lý video tốn nhiều tài nguyên, nên sử dụng với các file có dung lượng và độ phân giải vừa phải.
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Status Message */}
                        {!isLoaded && !statusMessage && (
                            <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-md border border-yellow-200 dark:border-yellow-900/20">
                                Đang khởi động "máy trạm" video... Vui lòng đợi trong giây lát.
                            </div>
                        )}
                        {statusMessage && (
                            <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-200 dark:border-blue-900/20">
                                {statusMessage}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <div className="w-full md:w-1/3">
                                <Label>Định dạng đầu ra</Label>
                                <Select value={targetFormat} onValueChange={(v) => setTargetFormat(v as VideoFormat)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn định dạng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mp4">MP4 (Phổ biến)</SelectItem>
                                        <SelectItem value="avi">AVI</SelectItem>
                                        <SelectItem value="mkv">MKV</SelectItem>
                                        <SelectItem value="mov">MOV (Apple)</SelectItem>
                                        <SelectItem value="wmv">WMV</SelectItem>
                                        <SelectItem value="flv">FLV (Flash)</SelectItem>
                                        <SelectItem value="webm">WEBM (Web)</SelectItem>
                                        <SelectItem value="m4v">M4V</SelectItem>
                                        <SelectItem value="mpeg">MPEG</SelectItem>
                                        <SelectItem value="3gp">3GP (Mobile)</SelectItem>
                                        <SelectItem value="gif">GIF (Animation)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="video-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors w-full h-32 flex-col gap-2"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm font-medium">Nhấn để tải lên file Video (MP4, AVI, MKV...)</span>
                                <input
                                    id="video-upload"
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept="video/*,.mkv,.flv,.avi,.mov,.wmv,.3gp"
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
                                        <div className="flex flex-col items-center justify-center w-8 h-8 bg-blue-500/10 rounded">
                                            <Video className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="grid gap-0.5">
                                            <span className="text-sm font-medium truncate max-w-[300px]">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
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
                        disabled={files.length === 0 || isProcessing || !isLoaded}
                        className="w-full md:w-auto"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : !isLoaded ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang tải bộ xử lý...
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
