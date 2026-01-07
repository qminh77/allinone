'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Download, FileText, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

export function ScribdDownloader() {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [progressMsg, setProgressMsg] = useState('Đang khởi tạo...')
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleDownload = (e: React.FormEvent) => {
        e.preventDefault()
        if (!url.trim()) {
            toast.error('Vui lòng nhập URL tài liệu Scribd')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)
        setProgressMsg('Đang kết nối đến server...')

        // Use EventSource for real-time progress
        const eventSource = new EventSource(`/api/scribd?url=${encodeURIComponent(url)}`)

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                if (data.type === 'progress') {
                    setProgressMsg(data.message)
                } else if (data.type === 'complete') {
                    setResult(data)
                    toast.success('Tài liệu đã sẵn sàng!')
                    setLoading(false)
                    eventSource.close()
                } else if (data.type === 'error') {
                    setError(data.message)
                    setLoading(false)
                    eventSource.close()
                    toast.error('Lỗi: ' + data.message)
                }
            } catch (err) {
                console.error('SSE Parse Error', err)
            }
        }

        eventSource.onerror = (err) => {
            console.error('SSE Error', err)
            if (eventSource.readyState === EventSource.CLOSED) return; // Normal close

            // Only set error if we are still loading (unexpected error)
            setError('Mất kết nối với server.')
            setLoading(false)
            eventSource.close()
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5 text-primary" />
                        Scribd Downloader
                    </CardTitle>
                    <CardDescription>
                        Tải tài liệu PDF từ Scribd miễn phí, không cần đăng nhập.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleDownload} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">Link tài liệu Scribd</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="url"
                                    placeholder="https://www.scribd.com/doc/..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={loading}
                                    className="font-medium"
                                />
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Tải ngay
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {loading && (
                        <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Trạng thái:</span>
                                <span className="font-medium text-primary animate-pulse">{progressMsg}</span>
                            </div>
                            <Progress value={100} className="h-2 w-full bg-secondary overflow-hidden">
                                <div className="h-full bg-primary/20 w-full animate-indeterminate-progress origin-left-right" />
                            </Progress>
                            <p className="text-xs text-center text-muted-foreground pt-2">
                                Vui lòng không tắt trình duyệt. Quá trình có thể mất 1-2 phút tùy độ dài tài liệu.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded bg-background border flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-red-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-sm line-clamp-1">{result.filename}</p>
                                    <p className="text-xs text-muted-foreground">PDF Document</p>
                                </div>
                            </div>
                            <Button asChild size="sm">
                                <a href={result.url} download={result.filename}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Tải về máy
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
