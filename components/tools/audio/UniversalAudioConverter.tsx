'use client'

import { useState, useRef, useEffect } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, Music, Loader2, Download } from 'lucide-react'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

interface UniversalAudioConverterProps {
    slug: string
    title: string
    description: string
}

type AudioFormat = 'mp3' | 'wav' | 'flac' | 'aac' | 'ogg' | 'm4a' | 'wma' | 'aiff' | 'opus' | 'amr' | 'mp2' | 'm4r'

export function UniversalAudioConverter({ slug, title, description }: UniversalAudioConverterProps) {
    const [files, setFiles] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [targetFormat, setTargetFormat] = useState<AudioFormat>('mp3')
    const [isLoaded, setIsLoaded] = useState(false)
    const [progress, setProgress] = useState(0)
    const [statusMessage, setStatusMessage] = useState('')
    const ffmpegRef = useRef<FFmpeg | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageRef = useRef<HTMLDivElement>(null)

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
            // console.log(message)
            if (messageRef.current) {
                // messageRef.current.innerHTML = message
            }
        })

        ffmpeg.on('progress', ({ progress, time }) => {
            // Progress is 0-1
            setProgress(Math.round(progress * 100))
        })

        try {
            // Use local files to avoid COOP/COEP issues with CDNs
            const baseURL = `${window.location.origin}/ffmpeg`
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            })
            setIsLoaded(true)
            console.log('FFmpeg loaded')
        } catch (error) {
            console.error('Failed to load FFmpeg:', error)
            toast.error('Không thể tải bộ xử lý âm thanh. Vui lòng kiểm tra kết nối mạng hoặc thử lại.')
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
        // Sanitize filename for FFmpeg (remove spaces/special chars) to avoid issues
        const safeName = 'input_' + Date.now() + fileName.substring(fileName.lastIndexOf('.'))

        // Write file to memfs
        await ffmpeg.writeFile(safeName, await fetchFile(file))

        const outName = `output_${Date.now()}.${targetFormat}`

        // Run FFmpeg command
        // -i input -c:a? logic depends on format
        // Basic conversion: ffmpeg -i input output
        setStatusMessage(`Đang chuyển đổi ${file.name}...`)

        // Determine codec if needed (optional, ffmpeg usually auto-detects based on extension)
        // For basic formats, extension is enough.
        await ffmpeg.exec(['-i', safeName, outName])

        // Read output
        const data = await ffmpeg.readFile(outName)

        // Cleanup
        await ffmpeg.deleteFile(safeName)
        await ffmpeg.deleteFile(outName)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blob = new Blob([data as any], { type: `audio/${targetFormat}` })
        const originalNameNoExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
        return { blob, name: `${originalNameNoExt}.${targetFormat}` }
    }

    // Helper to fetch file to Uint8Array
    const fetchFile = async (file: File) => {
        const arrayBuffer = await file.arrayBuffer()
        return new Uint8Array(arrayBuffer)
    }

    const handleConvert = async () => {
        if (files.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 file.')
            return
        }

        if (!isLoaded) {
            toast.error('Bộ xử lý âm thanh chưa sẵn sàng. Vui lòng đợi.')
            // Try loading again if failed previously?
            if (!loadRef.current) load()
            return
        }

        setIsProcessing(true)
        setProgress(0)
        setStatusMessage('Đang bắt đầu...')

        try {
            if (files.length === 1) {
                const { blob, name } = await convertFile(files[0])
                saveAs(blob, name)
                toast.success('Chuyển đổi thành công!')
            } else {
                const zip = new JSZip()
                let successCount = 0

                for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    try {
                        setStatusMessage(`Đang xử lý ${i + 1}/${files.length}: ${file.name}`)
                        const { blob, name } = await convertFile(file)
                        zip.file(name, blob)
                        successCount++
                    } catch (err) {
                        console.error(`Failed to convert ${file.name}`, err)
                        toast.error(`Lỗi khi chuyển đổi ${file.name}`)
                    }
                }

                if (successCount > 0) {
                    setStatusMessage('Đang nén file...')
                    const content = await zip.generateAsync({ type: 'blob' })
                    saveAs(content, `converted-audio.zip`)
                    toast.success(`Đã chuyển đổi thành công ${successCount}/${files.length} file!`)
                }
            }
        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra khi chuyển đổi (Có thể định dạng không được hỗ trợ hoặc file lỗi).')
        } finally {
            setIsProcessing(false)
            setProgress(0)
            setStatusMessage('')
        }
    }

    return (
        <ToolShell title={title} description={description} icon={Music}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Công cụ chuyển đổi Âm thanh Đa năng
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
                            Chuyển đổi qua lại giữa hơn 60 định dạng âm thanh (MP3, WAV, FLAC, M4A, OGG...).
                            <br />
                            <span className="text-xs text-muted-foreground">
                                * Công cụ chạy trực tiếp trên trình duyệt của bạn để bảo mật tuyệt đối. Lần đầu truy cập có thể mất vài giây để tải bộ xử lý (30MB).
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Status Message */}
                        {!isLoaded && !statusMessage && (
                            <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-md border border-yellow-200 dark:border-yellow-900/20">
                                Đang khởi động "máy trạm" âm thanh... Vui lòng đợi trong giây lát. Hệ thống sẽ tự động lưu vào bộ nhớ đệm cho lần sau.
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
                                <Select value={targetFormat} onValueChange={(v) => setTargetFormat(v as AudioFormat)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn định dạng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mp3">MP3 (Phổ biến)</SelectItem>
                                        <SelectItem value="wav">WAV (Chất lượng cao)</SelectItem>
                                        <SelectItem value="flac">FLAC (Lossless)</SelectItem>
                                        <SelectItem value="aac">AAC</SelectItem>
                                        <SelectItem value="ogg">OGG</SelectItem>
                                        <SelectItem value="m4a">M4A (Apple)</SelectItem>
                                        <SelectItem value="wma">WMA</SelectItem>
                                        <SelectItem value="aiff">AIFF</SelectItem>
                                        <SelectItem value="opus">OPUS (VoIP)</SelectItem>
                                        <SelectItem value="amr">AMR (Voice)</SelectItem>
                                        <SelectItem value="mp2">MP2</SelectItem>
                                        <SelectItem value="m4r">M4R (Ringtone)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="audio-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors w-full h-32 flex-col gap-2"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm font-medium">Nhấn để tải lên file Audio</span>
                                <input
                                    id="audio-upload"
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept="audio/*,.8svx,.aac,.ac3,.aiff,.amb,.amr,.ape,.au,.avr,.caf,.cdda,.cvs,.cvsd,.cvu,.dss,.dts,.dvms,.fap,.flac,.fssd,.gsm,.gsrt,.hcom,.htk,.ima,.ircam,.m4a,.m4r,.maud,.mp2,.mp3,.nist,.oga,.ogg,.opus,.paf,.prc,.pvf,.ra,.sd2,.shn,.sln,.smp,.snd,.sndr,.sndt,.sou,.sph,.spx,.tak,.tta,.txw,.vms,.voc,.vox,.vqf,.w64,.wav,.wma,.wv,.wve,.xa"
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
                                            <Music className="w-4 h-4 text-primary" />
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

                {progress > 0 && isProcessing && (
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </ToolShell>
    )
}
