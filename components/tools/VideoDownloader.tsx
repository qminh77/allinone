'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Video, ExternalLink, Film, Music } from 'lucide-react'
import { getVideoInfo } from '@/lib/actions/tools'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return 'N/A'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function VideoDownloader() {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url.trim()) {
            toast.error('Vui lòng nhập URL video')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const res = await getVideoInfo(url)

            if (res.error) {
                setError(res.error)
                toast.error('Lỗi khi lấy thông tin video')
            } else {
                setResult(res.data)
                toast.success('Đã lấy thông tin thành công!')
            }
        } catch (err: any) {
            setError(err.message || 'Lỗi không xác định')
        } finally {
            setLoading(false)
        }
    }

    // Filter relevant formats
    const getFormats = () => {
        if (!result || !result.formats) return []

        // Return valid formats with available url
        return result.formats.filter((f: any) => f.url && f.protocol !== 'm3u8_native')
            .sort((a: any, b: any) => {
                // Sort by resolution (height) desc
                return (b.height || 0) - (a.height || 0)
            })
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Video className="h-5 w-5 text-primary" />
                        Video Downloader
                    </CardTitle>
                    <CardDescription>
                        Tải video từ YouTube, TikTok, Facebook v.v. (Powered by yt-dlp)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAnalyze} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">Dán đường dẫn (Link) vào đây</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="url"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={loading}
                                    className="font-medium"
                                />
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lấy Link'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-start gap-4">
                            {result.thumbnail && (
                                <img
                                    src={result.thumbnail}
                                    alt="thumbnail"
                                    className="w-32 h-20 object-cover rounded-md shadow-sm"
                                />
                            )}
                            <div className="space-y-1">
                                <div className="font-bold line-clamp-2">{result.title}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span>{result.uploader}</span>
                                    <span>•</span>
                                    <span>{result.duration_string || result.duration + 's'}</span>
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Chất lượng</TableHead>
                                        <TableHead>Định dạng</TableHead>
                                        <TableHead>Kích thước (Est.)</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {getFormats().map((format: any, idx: number) => {
                                        const isVideo = format.vcodec !== 'none';
                                        const isAudio = format.acodec !== 'none';

                                        // Simple Label
                                        let label = 'Unknown';
                                        if (isVideo && isAudio) label = 'Video + Audio';
                                        else if (isVideo) label = 'Video Only';
                                        else if (isAudio) label = 'Audio Only';

                                        return (
                                            <TableRow key={format.format_id || idx}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {isVideo ? <Film className="h-4 w-4 text-blue-500" /> : <Music className="h-4 w-4 text-green-500" />}
                                                        {format.resolution || format.height + 'p' || 'Audio'}
                                                        {format.fps && ` (${format.fps}fps)`}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="uppercase">
                                                        {format.ext}
                                                    </Badge>
                                                    <span className="ml-2 text-xs text-muted-foreground">{label}</span>
                                                </TableCell>
                                                <TableCell text-muted-foreground>
                                                    {format.filesize ? formatBytes(format.filesize) : (format.filesize_approx ? '~' + formatBytes(format.filesize_approx) : 'N/A')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" asChild variant="secondary">
                                                        <a href={format.url} target="_blank" rel="noopener noreferrer" download>
                                                            <Download className="h-4 w-4 mr-1" /> Tải
                                                        </a>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
