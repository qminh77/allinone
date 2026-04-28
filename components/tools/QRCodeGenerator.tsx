'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as QRCode from 'qrcode'
import type { QRCodeRenderersOptions, QRCodeToStringOptions } from 'qrcode'
import { toast } from 'sonner'
import {
    AlertCircle,
    CalendarDays,
    Check,
    Clipboard,
    Copy,
    Download,
    FileDown,
    Folder,
    ImageDown,
    Link2,
    Loader2,
    QrCode,
    Save,
    Search,
    Settings2,
    Tag,
    Trash2,
} from 'lucide-react'

import { createShortlink } from '@/lib/actions/shortlinks'
import {
    buildQrPayload,
    clampOutputSize,
    createDefaultQrForm,
    createQrId,
    DEFAULT_QR_DESIGN,
    getQrTypeName,
    mergeQrDesign,
    mergeQrFormValues,
    parseTags,
    QR_TYPE_DEFINITIONS,
    sanitizeQrFilename,
    type AppPlatform,
    type CryptoNetwork,
    type QrDesign,
    type QrFormValues,
    type QrType,
    type SavedQrCode,
    type SocialPlatform,
    type WifiEncryption,
} from '@/lib/qr-code'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { AiQrCodeDialog } from '@/components/tools/AiQrCodeDialog'

const STORAGE_KEY = 'allinone.qr-codes.v1'
const MAX_HISTORY_ITEMS = 100
const PREVIEW_WIDTH = 420

type BusyAction = 'png' | 'svg' | 'pdf' | 'copy' | 'shortlink' | 'save' | null

const SOCIAL_OPTIONS: { value: SocialPlatform; label: string }[] = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'zalo', label: 'Zalo' },
]

const CRYPTO_OPTIONS: { value: CryptoNetwork; label: string }[] = [
    { value: 'bitcoin', label: 'Bitcoin' },
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'litecoin', label: 'Litecoin' },
    { value: 'dogecoin', label: 'Dogecoin' },
    { value: 'custom', label: 'Custom / raw address' },
]

const APP_OPTIONS: { value: AppPlatform; label: string }[] = [
    { value: 'play-store', label: 'Google Play' },
    { value: 'app-store', label: 'App Store' },
    { value: 'direct', label: 'Direct URL' },
]

const WIFI_OPTIONS: { value: WifiEncryption; label: string }[] = [
    { value: 'WPA', label: 'WPA/WPA2' },
    { value: 'WEP', label: 'WEP' },
    { value: 'nopass', label: 'No password' },
]

export function QRCodeGenerator() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [qrType, setQrType] = useState<QrType>('url')
    const [form, setForm] = useState<QrFormValues>(() => createDefaultQrForm())
    const [design, setDesign] = useState<QrDesign>(DEFAULT_QR_DESIGN)
    const [qrName, setQrName] = useState('')
    const [folder, setFolder] = useState('')
    const [tagInput, setTagInput] = useState('')
    const [history, setHistory] = useState<SavedQrCode[]>([])
    const [historyQuery, setHistoryQuery] = useState('')
    const [dynamicShortUrl, setDynamicShortUrl] = useState('')
    const [previewError, setPreviewError] = useState('')
    const [busyAction, setBusyAction] = useState<BusyAction>(null)

    const payloadResult = useMemo(() => buildQrPayload(qrType, form), [qrType, form])
    const effectivePayload = dynamicShortUrl || (payloadResult.error ? '' : payloadResult.payload)
    const activeName = qrName.trim() || payloadResult.label || getQrTypeName(qrType)
    const contrastWarning = useMemo(
        () => getContrastWarning(design.foreground, design.background),
        [design.foreground, design.background]
    )

    const filteredHistory = useMemo(() => {
        const query = historyQuery.trim().toLowerCase()
        if (!query) return history

        return history.filter(item => {
            return [
                item.name,
                getQrTypeName(item.type),
                item.payload,
                item.folder,
                item.tags.join(' '),
            ].some(value => value.toLowerCase().includes(query))
        })
    }, [history, historyQuery])

    useEffect(() => {
        setDynamicShortUrl('')
    }, [payloadResult.payload, payloadResult.normalizedUrl])

    useEffect(() => {
        setHistory(readStoredHistory())
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        if (!effectivePayload) {
            setPreviewError('')
            const context = canvas.getContext('2d')
            context?.clearRect(0, 0, canvas.width, canvas.height)
            return
        }

        let cancelled = false
        const timeout = window.setTimeout(async () => {
            try {
                await QRCode.toCanvas(canvas, effectivePayload, getRenderOptions(design, Math.min(design.size, PREVIEW_WIDTH)))
                if (!cancelled) setPreviewError('')
            } catch (error) {
                if (!cancelled) {
                    setPreviewError(error instanceof Error ? error.message : 'Không thể tạo QR từ dữ liệu hiện tại.')
                }
            }
        }, 120)

        return () => {
            cancelled = true
            window.clearTimeout(timeout)
        }
    }, [effectivePayload, design])

    const updateFormValue = <K extends keyof QrFormValues>(key: K, value: QrFormValues[K]) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    const updateFormGroup = <K extends keyof QrFormValues>(key: K, patch: Partial<QrFormValues[K]>) => {
        setForm(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] as Record<string, unknown>),
                ...patch,
            } as QrFormValues[K],
        }))
    }

    const updateDesign = (patch: Partial<QrDesign>) => {
        setDesign(prev => mergeQrDesign({ ...prev, ...patch }))
    }

    const withQrAction = async (action: BusyAction, callback: () => Promise<void>) => {
        if (!effectivePayload || payloadResult.error) return
        setBusyAction(action)
        try {
            await callback()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể xử lý QR Code.')
        } finally {
            setBusyAction(null)
        }
    }

    const handleDownloadPng = () => withQrAction('png', async () => {
        const blob = await renderPngBlob(effectivePayload, design)
        downloadBlob(blob, `${sanitizeQrFilename(activeName)}.png`)
        toast.success('Đã tải PNG.')
    })

    const handleDownloadSvg = () => withQrAction('svg', async () => {
        const svg = await QRCode.toString(effectivePayload, getSvgOptions(design))
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
        downloadBlob(blob, `${sanitizeQrFilename(activeName)}.svg`)
        toast.success('Đã tải SVG.')
    })

    const handleDownloadPdf = () => withQrAction('pdf', async () => {
        const blob = await renderPngBlob(effectivePayload, design)
        const pdfBlob = await renderPdfBlob(blob)
        downloadBlob(pdfBlob, `${sanitizeQrFilename(activeName)}.pdf`)
        toast.success('Đã tải PDF.')
    })

    const handleCopyImage = () => withQrAction('copy', async () => {
        const blob = await renderPngBlob(effectivePayload, design)
        const ClipboardItemCtor = window.ClipboardItem

        if (!navigator.clipboard || !ClipboardItemCtor || !navigator.clipboard.write) {
            await navigator.clipboard?.writeText(effectivePayload)
            toast.success('Trình duyệt không hỗ trợ copy ảnh, đã copy nội dung QR.')
            return
        }

        await navigator.clipboard.write([new ClipboardItemCtor({ [blob.type]: blob })])
        toast.success('Đã copy ảnh QR.')
    })

    const handleCreateDynamicShortlink = () => withQrAction('shortlink', async () => {
        if (!payloadResult.normalizedUrl) {
            throw new Error('Dynamic shortlink chỉ khả dụng với QR dạng URL.')
        }

        const formData = new FormData()
        formData.append('target_url', payloadResult.normalizedUrl)

        const result = await createShortlink(formData)
        if (result.error) throw new Error(result.error)
        if (!result.slug) throw new Error('Không nhận được slug shortlink.')

        const shortUrl = `${window.location.origin}/${result.slug}`
        setDynamicShortUrl(shortUrl)
        toast.success('Đã tạo dynamic shortlink.')
    })

    const handleSaveCurrent = () => withQrAction('save', async () => {
        const now = new Date().toISOString()
        const item: SavedQrCode = {
            id: createQrId(),
            name: activeName,
            type: qrType,
            payload: effectivePayload,
            form,
            design,
            folder: folder.trim(),
            tags: parseTags(tagInput),
            shortUrl: dynamicShortUrl || undefined,
            createdAt: now,
            updatedAt: now,
        }

        const next = [item, ...history].slice(0, MAX_HISTORY_ITEMS)
        persistHistory(next)
        toast.success('Đã lưu QR vào My QR Codes.')
    })

    const handleApplyAiDraft = (draft: {
        type: QrType
        form: QrFormValues
        design: QrDesign
        name: string
        folder: string
        tags: string[]
    }) => {
        setQrType(draft.type)
        setForm(mergeQrFormValues(draft.form))
        setDesign(mergeQrDesign(draft.design))
        setQrName(draft.name)
        setFolder(draft.folder)
        setTagInput(draft.tags.join(', '))
        setDynamicShortUrl('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleLoadSaved = (item: SavedQrCode) => {
        setQrType(item.type)
        setForm(mergeQrFormValues(item.form))
        setDesign(mergeQrDesign(item.design))
        setQrName(item.name)
        setFolder(item.folder)
        setTagInput(item.tags.join(', '))
        setDynamicShortUrl(item.shortUrl || '')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleRenameSaved = (id: string, name: string) => {
        const next = history.map(item => (
            item.id === id ? { ...item, name, updatedAt: new Date().toISOString() } : item
        ))
        persistHistory(next)
    }

    const handleDeleteSaved = (id: string) => {
        const next = history.filter(item => item.id !== id)
        persistHistory(next)
        toast.success('Đã xóa QR.')
    }

    const persistHistory = (next: SavedQrCode[]) => {
        setHistory(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }

    const canUseQr = Boolean(effectivePayload && !payloadResult.error && !previewError)

    return (
        <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <QrCode className="size-5 text-primary" />
                                        Tạo QR Code
                                    </CardTitle>
                                    <CardDescription>Chọn loại QR và nhập dữ liệu cần mã hóa.</CardDescription>
                                </div>
                                <AiQrCodeDialog currentType={qrType} onApply={handleApplyAiDraft} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Loại QR Code</Label>
                                <Select value={qrType} onValueChange={(value) => setQrType(value as QrType)}>
                                    <SelectTrigger className="w-full bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {QR_TYPE_DEFINITIONS.map(type => (
                                            <SelectItem key={type.key} value={type.key}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {QR_TYPE_DEFINITIONS.find(type => type.key === qrType)?.description}
                                </p>
                            </div>

                            <Separator />

                            {renderTypeFields(qrType, form, updateFormValue, updateFormGroup)}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="size-5 text-primary" />
                                Thiết kế cơ bản
                            </CardTitle>
                            <CardDescription>Màu, kích thước output và mức error correction.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <ColorInput
                                    id="qr-foreground"
                                    label="Foreground"
                                    value={design.foreground}
                                    onChange={(value) => updateDesign({ foreground: value })}
                                />
                                <ColorInput
                                    id="qr-background"
                                    label="Background"
                                    value={design.background}
                                    onChange={(value) => updateDesign({ background: value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <Label>Kích thước output: {design.size}px</Label>
                                    <Badge variant="outline">200 - 2000 px</Badge>
                                </div>
                                <Slider
                                    value={[design.size]}
                                    min={200}
                                    max={2000}
                                    step={50}
                                    onValueChange={([value]) => updateDesign({ size: value })}
                                    className="py-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Error correction</Label>
                                <Select
                                    value={design.errorCorrectionLevel}
                                    onValueChange={(value) => updateDesign({ errorCorrectionLevel: value as QrDesign['errorCorrectionLevel'] })}
                                >
                                    <SelectTrigger className="w-full bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="L">L - Low, QR gọn hơn</SelectItem>
                                        <SelectItem value="M">M - Medium</SelectItem>
                                        <SelectItem value="Q">Q - Quartile</SelectItem>
                                        <SelectItem value="H">H - High, dễ scan hơn khi có hao hụt</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Folder className="size-5 text-primary" />
                                Lưu trữ
                            </CardTitle>
                            <CardDescription>Đặt tên, folder và tag trước khi lưu vào My QR Codes.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2 sm:col-span-3">
                                <Label htmlFor="qr-name">Tên QR</Label>
                                <Input
                                    id="qr-name"
                                    value={qrName}
                                    onChange={(event) => setQrName(event.target.value)}
                                    placeholder={payloadResult.label || 'QR Code'}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="qr-folder">Folder</Label>
                                <Input
                                    id="qr-folder"
                                    value={folder}
                                    onChange={(event) => setFolder(event.target.value)}
                                    placeholder="Marketing"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="qr-tags">Tags</Label>
                                <Input
                                    id="qr-tags"
                                    value={tagInput}
                                    onChange={(event) => setTagInput(event.target.value)}
                                    placeholder="campaign, print, product"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="h-fit xl:sticky xl:top-6">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <CardTitle>Preview realtime</CardTitle>
                                <CardDescription>
                                    {dynamicShortUrl ? 'Dynamic QR dùng shortlink.' : 'Static QR tạo trực tiếp từ dữ liệu.'}
                                </CardDescription>
                            </div>
                            <Badge variant={dynamicShortUrl ? 'default' : 'secondary'}>
                                {dynamicShortUrl ? 'Dynamic' : 'Static'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {payloadResult.error && (
                            <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertDescription>{payloadResult.error}</AlertDescription>
                            </Alert>
                        )}

                        {!payloadResult.error && payloadResult.warning && (
                            <Alert>
                                <AlertCircle className="size-4" />
                                <AlertDescription>{payloadResult.warning}</AlertDescription>
                            </Alert>
                        )}

                        {contrastWarning && (
                            <Alert>
                                <AlertCircle className="size-4" />
                                <AlertDescription>{contrastWarning}</AlertDescription>
                            </Alert>
                        )}

                        {previewError && (
                            <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertDescription>{previewError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-center rounded-lg border bg-muted/30 p-4">
                            <canvas
                                ref={canvasRef}
                                width={PREVIEW_WIDTH}
                                height={PREVIEW_WIDTH}
                                className="aspect-square w-full max-w-[320px] rounded-md bg-background shadow-sm"
                            />
                        </div>

                        {dynamicShortUrl && (
                            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                                <Link2 className="size-4 shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate font-mono">{dynamicShortUrl}</span>
                                <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={() => copyText(dynamicShortUrl)}
                                >
                                    <Copy className="size-4" />
                                    <span className="sr-only">Copy shortlink</span>
                                </Button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label>Payload</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={!effectivePayload}
                                    onClick={() => copyText(effectivePayload)}
                                >
                                    <Copy className="size-4" />
                                    Copy
                                </Button>
                            </div>
                            <Textarea
                                value={effectivePayload}
                                readOnly
                                rows={5}
                                className="min-h-28 resize-none font-mono text-xs"
                                placeholder="Payload QR sẽ hiển thị khi dữ liệu hợp lệ."
                            />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                            <Button type="button" onClick={handleDownloadPng} disabled={!canUseQr || busyAction !== null}>
                                {busyAction === 'png' ? <Loader2 className="size-4 animate-spin" /> : <ImageDown className="size-4" />}
                                Download PNG
                            </Button>
                            <Button type="button" variant="outline" onClick={handleDownloadSvg} disabled={!canUseQr || busyAction !== null}>
                                {busyAction === 'svg' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                                Download SVG
                            </Button>
                            <Button type="button" variant="outline" onClick={handleDownloadPdf} disabled={!canUseQr || busyAction !== null}>
                                {busyAction === 'pdf' ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
                                Download PDF
                            </Button>
                            <Button type="button" variant="secondary" onClick={handleCopyImage} disabled={!canUseQr || busyAction !== null}>
                                {busyAction === 'copy' ? <Loader2 className="size-4 animate-spin" /> : <Clipboard className="size-4" />}
                                Copy image
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCreateDynamicShortlink}
                                disabled={!canUseQr || !payloadResult.isUrlLike || busyAction !== null}
                            >
                                {busyAction === 'shortlink' ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
                                Tạo link ngắn
                            </Button>
                            <Button type="button" variant="outline" onClick={handleSaveCurrent} disabled={!canUseQr || busyAction !== null}>
                                {busyAction === 'save' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                Lưu QR
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <CardTitle>My QR Codes</CardTitle>
                            <CardDescription>Tìm kiếm, đổi tên, mở lại hoặc xóa QR đã lưu trên trình duyệt này.</CardDescription>
                        </div>
                        <div className="relative w-full lg:max-w-sm">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={historyQuery}
                                onChange={(event) => setHistoryQuery(event.target.value)}
                                className="pl-9"
                                placeholder="Tìm theo tên, folder, tag..."
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                            Chưa có QR nào được lưu.
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                            Không tìm thấy QR phù hợp.
                        </div>
                    ) : (
                        <ScrollArea className="max-h-[520px] pr-3">
                            <div className="space-y-2">
                                {filteredHistory.map(item => (
                                    <div key={item.id} className="rounded-lg border bg-card p-3">
                                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                                            <div className="min-w-0 space-y-3">
                                                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px]">
                                                    <Input
                                                        value={item.name}
                                                        onChange={(event) => handleRenameSaved(item.id, event.target.value)}
                                                        className="h-8 font-medium"
                                                        aria-label="Tên QR đã lưu"
                                                    />
                                                    <Badge variant="outline" className="h-8 justify-center rounded-md">
                                                        {getQrTypeName(item.type)}
                                                    </Badge>
                                                </div>
                                                <p className="line-clamp-1 font-mono text-xs text-muted-foreground">
                                                    {item.payload}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                    {item.folder && (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <Folder className="size-3" />
                                                            {item.folder}
                                                        </Badge>
                                                    )}
                                                    {item.tags.map(tag => (
                                                        <Badge key={tag} variant="outline" className="gap-1">
                                                            <Tag className="size-3" />
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    <span>{new Date(item.updatedAt).toLocaleString('vi-VN')}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 lg:justify-end">
                                                <Button type="button" size="sm" variant="secondary" onClick={() => handleLoadSaved(item)}>
                                                    <Check className="size-4" />
                                                    Mở
                                                </Button>
                                                <Button type="button" size="icon-sm" variant="ghost" onClick={() => copyText(item.payload)}>
                                                    <Copy className="size-4" />
                                                    <span className="sr-only">Copy payload</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteSaved(item.id)}
                                                >
                                                    <Trash2 className="size-4" />
                                                    <span className="sr-only">Xóa QR</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function renderTypeFields(
    qrType: QrType,
    form: QrFormValues,
    updateFormValue: <K extends keyof QrFormValues>(key: K, value: QrFormValues[K]) => void,
    updateFormGroup: <K extends keyof QrFormValues>(key: K, patch: Partial<QrFormValues[K]>) => void
) {
    switch (qrType) {
        case 'url':
            return (
                <FieldGroup>
                    <TextField
                        id="qr-url"
                        label="URL"
                        value={form.url}
                        onChange={(value) => updateFormValue('url', value)}
                        placeholder="https://example.com"
                    />
                </FieldGroup>
            )
        case 'text':
            return (
                <FieldGroup>
                    <TextAreaField
                        id="qr-text"
                        label="Text"
                        value={form.text}
                        onChange={(value) => updateFormValue('text', value)}
                        placeholder="Nhập văn bản cần tạo QR"
                    />
                </FieldGroup>
            )
        case 'email':
            return (
                <FieldGroup>
                    <TextField
                        id="qr-email-to"
                        label="Email người nhận"
                        value={form.email.to}
                        onChange={(value) => updateFormGroup('email', { to: value })}
                        placeholder="name@example.com"
                    />
                    <TextField
                        id="qr-email-subject"
                        label="Subject"
                        value={form.email.subject}
                        onChange={(value) => updateFormGroup('email', { subject: value })}
                        placeholder="Tiêu đề email"
                    />
                    <TextAreaField
                        id="qr-email-body"
                        label="Body"
                        value={form.email.body}
                        onChange={(value) => updateFormGroup('email', { body: value })}
                        placeholder="Nội dung email"
                    />
                </FieldGroup>
            )
        case 'phone':
            return (
                <FieldGroup>
                    <TextField
                        id="qr-phone"
                        label="Số điện thoại"
                        value={form.phone}
                        onChange={(value) => updateFormValue('phone', value)}
                        placeholder="+84901234567"
                    />
                </FieldGroup>
            )
        case 'sms':
            return (
                <FieldGroup>
                    <TextField
                        id="qr-sms-phone"
                        label="Số điện thoại"
                        value={form.sms.phone}
                        onChange={(value) => updateFormGroup('sms', { phone: value })}
                        placeholder="+84901234567"
                    />
                    <TextAreaField
                        id="qr-sms-message"
                        label="Tin nhắn"
                        value={form.sms.message}
                        onChange={(value) => updateFormGroup('sms', { message: value })}
                        placeholder="Nội dung SMS"
                    />
                </FieldGroup>
            )
        case 'wifi':
            return (
                <FieldGroup>
                    <TextField
                        id="qr-wifi-ssid"
                        label="SSID"
                        value={form.wifi.ssid}
                        onChange={(value) => updateFormGroup('wifi', { ssid: value })}
                        placeholder="Tên WiFi"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Security</Label>
                            <Select
                                value={form.wifi.encryption}
                                onValueChange={(value) => updateFormGroup('wifi', { encryption: value as WifiEncryption })}
                            >
                                <SelectTrigger className="w-full bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {WIFI_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <TextField
                            id="qr-wifi-password"
                            label="Password"
                            value={form.wifi.password}
                            onChange={(value) => updateFormGroup('wifi', { password: value })}
                            placeholder="Mật khẩu WiFi"
                            type="password"
                            disabled={form.wifi.encryption === 'nopass'}
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="qr-wifi-hidden" className="cursor-pointer">Hidden SSID</Label>
                        <Switch
                            id="qr-wifi-hidden"
                            checked={form.wifi.hidden}
                            onCheckedChange={(checked) => updateFormGroup('wifi', { hidden: checked })}
                        />
                    </div>
                </FieldGroup>
            )
        case 'vcard':
            return (
                <FieldGroup>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            id="qr-vcard-first"
                            label="First name"
                            value={form.vcard.firstName}
                            onChange={(value) => updateFormGroup('vcard', { firstName: value })}
                            placeholder="Minh"
                        />
                        <TextField
                            id="qr-vcard-last"
                            label="Last name"
                            value={form.vcard.lastName}
                            onChange={(value) => updateFormGroup('vcard', { lastName: value })}
                            placeholder="Nguyen"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            id="qr-vcard-org"
                            label="Company"
                            value={form.vcard.organization}
                            onChange={(value) => updateFormGroup('vcard', { organization: value })}
                            placeholder="Allinone"
                        />
                        <TextField
                            id="qr-vcard-title"
                            label="Title"
                            value={form.vcard.title}
                            onChange={(value) => updateFormGroup('vcard', { title: value })}
                            placeholder="Product Manager"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            id="qr-vcard-phone"
                            label="Phone"
                            value={form.vcard.phone}
                            onChange={(value) => updateFormGroup('vcard', { phone: value })}
                            placeholder="+84901234567"
                        />
                        <TextField
                            id="qr-vcard-email"
                            label="Email"
                            value={form.vcard.email}
                            onChange={(value) => updateFormGroup('vcard', { email: value })}
                            placeholder="name@example.com"
                        />
                    </div>
                    <TextField
                        id="qr-vcard-website"
                        label="Website"
                        value={form.vcard.website}
                        onChange={(value) => updateFormGroup('vcard', { website: value })}
                        placeholder="https://example.com"
                    />
                    <TextAreaField
                        id="qr-vcard-address"
                        label="Address"
                        value={form.vcard.address}
                        onChange={(value) => updateFormGroup('vcard', { address: value })}
                        placeholder="Địa chỉ"
                    />
                    <TextAreaField
                        id="qr-vcard-note"
                        label="Note"
                        value={form.vcard.note}
                        onChange={(value) => updateFormGroup('vcard', { note: value })}
                        placeholder="Ghi chú"
                    />
                </FieldGroup>
            )
        case 'location':
            return (
                <FieldGroup>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            id="qr-location-lat"
                            label="Latitude"
                            value={form.location.latitude}
                            onChange={(value) => updateFormGroup('location', { latitude: value })}
                            placeholder="10.7769"
                        />
                        <TextField
                            id="qr-location-lng"
                            label="Longitude"
                            value={form.location.longitude}
                            onChange={(value) => updateFormGroup('location', { longitude: value })}
                            placeholder="106.7009"
                        />
                    </div>
                    <TextField
                        id="qr-location-label"
                        label="Label"
                        value={form.location.label}
                        onChange={(value) => updateFormGroup('location', { label: value })}
                        placeholder="Ho Chi Minh City"
                    />
                </FieldGroup>
            )
        case 'event':
            return (
                <FieldGroup>
                    <TextField
                        id="qr-event-title"
                        label="Tên sự kiện"
                        value={form.event.title}
                        onChange={(value) => updateFormGroup('event', { title: value })}
                        placeholder="Workshop"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            id="qr-event-start"
                            label="Bắt đầu"
                            value={form.event.startsAt}
                            onChange={(value) => updateFormGroup('event', { startsAt: value })}
                            type="datetime-local"
                            icon={<CalendarDays className="size-4" />}
                        />
                        <TextField
                            id="qr-event-end"
                            label="Kết thúc"
                            value={form.event.endsAt}
                            onChange={(value) => updateFormGroup('event', { endsAt: value })}
                            type="datetime-local"
                            icon={<CalendarDays className="size-4" />}
                        />
                    </div>
                    <TextField
                        id="qr-event-location"
                        label="Địa điểm"
                        value={form.event.location}
                        onChange={(value) => updateFormGroup('event', { location: value })}
                        placeholder="Meeting room"
                    />
                    <TextAreaField
                        id="qr-event-description"
                        label="Mô tả"
                        value={form.event.description}
                        onChange={(value) => updateFormGroup('event', { description: value })}
                        placeholder="Nội dung sự kiện"
                    />
                </FieldGroup>
            )
        case 'social':
            return (
                <FieldGroup>
                    <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                        <div className="space-y-2">
                            <Label>Platform</Label>
                            <Select
                                value={form.social.platform}
                                onValueChange={(value) => updateFormGroup('social', { platform: value as SocialPlatform })}
                            >
                                <SelectTrigger className="w-full bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SOCIAL_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <TextField
                            id="qr-social-value"
                            label="Username / URL"
                            value={form.social.value}
                            onChange={(value) => updateFormGroup('social', { value })}
                            placeholder="@username hoặc URL đầy đủ"
                        />
                    </div>
                </FieldGroup>
            )
        case 'crypto':
            return (
                <FieldGroup>
                    <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                        <div className="space-y-2">
                            <Label>Network</Label>
                            <Select
                                value={form.crypto.network}
                                onValueChange={(value) => updateFormGroup('crypto', { network: value as CryptoNetwork })}
                            >
                                <SelectTrigger className="w-full bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CRYPTO_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <TextField
                            id="qr-crypto-address"
                            label="Address"
                            value={form.crypto.address}
                            onChange={(value) => updateFormGroup('crypto', { address: value })}
                            placeholder="Địa chỉ ví"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            id="qr-crypto-amount"
                            label="Amount"
                            value={form.crypto.amount}
                            onChange={(value) => updateFormGroup('crypto', { amount: value })}
                            placeholder="0.01"
                        />
                        <TextField
                            id="qr-crypto-label"
                            label="Label"
                            value={form.crypto.label}
                            onChange={(value) => updateFormGroup('crypto', { label: value })}
                            placeholder="Invoice #001"
                        />
                    </div>
                </FieldGroup>
            )
        case 'file':
            return (
                <FieldGroup>
                    <TextField
                        id="qr-file-url"
                        label="File URL"
                        value={form.file.url}
                        onChange={(value) => updateFormGroup('file', { url: value })}
                        placeholder="https://example.com/file.pdf"
                    />
                </FieldGroup>
            )
        case 'app':
            return (
                <FieldGroup>
                    <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                        <div className="space-y-2">
                            <Label>Store</Label>
                            <Select
                                value={form.app.platform}
                                onValueChange={(value) => updateFormGroup('app', { platform: value as AppPlatform })}
                            >
                                <SelectTrigger className="w-full bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {APP_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <TextField
                            id="qr-app-value"
                            label="App ID / Package / URL"
                            value={form.app.value}
                            onChange={(value) => updateFormGroup('app', { value })}
                            placeholder="com.company.app hoặc 123456789"
                        />
                    </div>
                </FieldGroup>
            )
    }
}

function FieldGroup({ children }: { children: React.ReactNode }) {
    return <div className="space-y-4">{children}</div>
}

function TextField({
    id,
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    disabled,
    icon,
}: {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    type?: string
    disabled?: boolean
    icon?: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={icon ? 'pl-9' : undefined}
                />
            </div>
        </div>
    )
}

function TextAreaField({
    id,
    label,
    value,
    onChange,
    placeholder,
}: {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Textarea
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={4}
            />
        </div>
    )
}

function ColorInput({
    id,
    label,
    value,
    onChange,
}: {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2">
                <Input
                    id={id}
                    type="color"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-10 w-11 cursor-pointer p-1"
                />
                <Input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="font-mono"
                    maxLength={7}
                />
            </div>
        </div>
    )
}

function getRenderOptions(design: QrDesign, width = design.size): QRCodeRenderersOptions {
    return {
        errorCorrectionLevel: design.errorCorrectionLevel,
        margin: 2,
        width: clampOutputSize(width),
        color: {
            dark: design.foreground,
            light: design.background,
        },
    }
}

function getSvgOptions(design: QrDesign): QRCodeToStringOptions {
    return {
        ...getRenderOptions(design, design.size),
        type: 'svg',
    }
}

async function renderPngBlob(payload: string, design: QrDesign) {
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, payload, getRenderOptions(design, design.size))

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Không thể tạo PNG từ QR Code.'))
        }, 'image/png')
    })
}

async function renderPdfBlob(pngBlob: Blob) {
    const { PDFDocument } = await import('pdf-lib')
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89])
    const image = await pdf.embedPng(await pngBlob.arrayBuffer())
    const pageWidth = page.getWidth()
    const pageHeight = page.getHeight()
    const size = Math.min(460, pageWidth - 96, pageHeight - 96)

    page.drawImage(image, {
        x: (pageWidth - size) / 2,
        y: (pageHeight - size) / 2,
        width: size,
        height: size,
    })

    const bytes = await pdf.save()
    const pdfBuffer = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(pdfBuffer).set(bytes)

    return new Blob([pdfBuffer], { type: 'application/pdf' })
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function copyText(value: string) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success('Đã copy.')
}

function readStoredHistory(): SavedQrCode[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []

        return parsed
            .map(normalizeSavedQrCode)
            .filter((item): item is SavedQrCode => Boolean(item))
            .slice(0, MAX_HISTORY_ITEMS)
    } catch {
        return []
    }
}

function normalizeSavedQrCode(item: unknown): SavedQrCode | null {
    if (!item || typeof item !== 'object') return null
    const source = item as Partial<SavedQrCode>
    if (!source.id || !source.payload || !source.type || !isQrType(source.type)) return null

    return {
        id: String(source.id),
        name: String(source.name || getQrTypeName(source.type)),
        type: source.type,
        payload: String(source.payload),
        form: mergeQrFormValues(source.form),
        design: mergeQrDesign(source.design),
        folder: String(source.folder || ''),
        tags: Array.isArray(source.tags) ? source.tags.map(String).slice(0, 12) : [],
        shortUrl: source.shortUrl ? String(source.shortUrl) : undefined,
        createdAt: source.createdAt || new Date().toISOString(),
        updatedAt: source.updatedAt || source.createdAt || new Date().toISOString(),
    }
}

function isQrType(value: unknown): value is QrType {
    return QR_TYPE_DEFINITIONS.some(type => type.key === value)
}

function getContrastWarning(foreground: string, background: string) {
    const ratio = getContrastRatio(foreground, background)
    if (ratio === null) return 'Mã màu không hợp lệ có thể làm QR không render được.'
    if (ratio < 2.2) return 'Độ tương phản giữa foreground và background thấp, QR có thể khó scan.'
    return ''
}

function getContrastRatio(foreground: string, background: string) {
    const fg = parseHexColor(foreground)
    const bg = parseHexColor(background)
    if (!fg || !bg) return null

    const fgLum = getRelativeLuminance(fg)
    const bgLum = getRelativeLuminance(bg)
    const lighter = Math.max(fgLum, bgLum)
    const darker = Math.min(fgLum, bgLum)

    return (lighter + 0.05) / (darker + 0.05)
}

function parseHexColor(value: string) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value)
    if (!match) return null

    return [
        Number.parseInt(match[1], 16),
        Number.parseInt(match[2], 16),
        Number.parseInt(match[3], 16),
    ] as const
}

function getRelativeLuminance([r, g, b]: readonly [number, number, number]) {
    const [rs, gs, bs] = [r, g, b].map(channel => {
        const value = channel / 255
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}
