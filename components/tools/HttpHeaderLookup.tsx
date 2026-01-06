'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeftRight, Search, Loader2, Copy } from 'lucide-react'
import { performHeaderLookup } from '@/lib/actions/tools'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function HttpHeaderLookup() {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url.trim()) return

        setLoading(true)
        setError(null)
        setResult(null)

        const res = await performHeaderLookup(url)

        if (res.error) {
            setError(res.error)
            toast.error(res.error)
        } else {
            setResult(res.data)
            toast.success('Successfully fetched headers!')
        }

        setLoading(false)
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'bg-green-500' // Success
        if (status >= 300 && status < 400) return 'bg-blue-500' // Redirect
        if (status >= 400 && status < 500) return 'bg-yellow-500' // Client Error
        if (status >= 500) return 'bg-red-500' // Server Error
        return 'bg-gray-500'
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>HTTP Header Lookup</CardTitle>
                    <CardDescription>Kiểm tra HTTP Response Headers và Status Code của URL.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLookup} className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="url" className="sr-only">URL</Label>
                            <Input
                                id="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                            Get Headers
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Lỗi kết nối</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-l-4 border-l-primary/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Badge className={`${getStatusColor(result.status)} text-white hover:opacity-90`}>
                                    {result.status} {result.statusText}
                                </Badge>
                                <span className="font-mono text-sm text-muted-foreground truncate max-w-[300px]" title={result.url}>
                                    {result.url}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                                Response Headers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Header Name</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(result.headers).map(([key, value]: [string, any], idx) => (
                                        <TableRow key={idx} className="group">
                                            <TableCell className="font-medium font-mono text-xs text-muted-foreground uppercase">{key}</TableCell>
                                            <TableCell className="font-mono text-xs break-all">{value}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleCopy(`${key}: ${value}`)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
