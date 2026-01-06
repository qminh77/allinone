'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Link2, Copy, Search, ExternalLink, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function UrlParser() {
    const [url, setUrl] = useState('')
    const [parsed, setParsed] = useState<URL | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [params, setParams] = useState<[string, string][]>([])

    const parseUrl = (input: string) => {
        setError(null)
        setParsed(null)
        setParams([])

        if (!input.trim()) return

        try {
            // Attempt to prepend https:// if missing protocol, for better UX
            let urlToParse = input
            if (!/^https?:\/\//i.test(input) && !input.startsWith('//')) {
                urlToParse = 'https://' + input
            }

            const urlObj = new URL(urlToParse)
            setParsed(urlObj)
            setParams(Array.from(urlObj.searchParams.entries()))
        } catch (err) {
            setError('Invalid URL format')
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setUrl(val)
        parseUrl(val)
    }

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`Copied ${label}`)
    }

    const handleReset = () => {
        setUrl('')
        setParsed(null)
        setParams([])
        setError(null)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Url Parser</CardTitle>
                    <CardDescription>
                        Phân tích cấu trúc URL và các tham số truy vấn (Query Params).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="url-input" className="sr-only">URL</Label>
                            <Input
                                id="url-input"
                                placeholder="https://example.com/path?query=123"
                                value={url}
                                onChange={handleInputChange}
                                className="font-mono"
                            />
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleReset} title="Clear">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Lỗi</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {parsed && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Link2 className="h-4 w-4 text-muted-foreground" />
                                URL Components
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <UrlComponent label="Protocol" value={parsed.protocol} onCopy={() => handleCopy(parsed.protocol, 'Protocol')} />
                            <UrlComponent label="Hostname" value={parsed.hostname} onCopy={() => handleCopy(parsed.hostname, 'Hostname')} />
                            <UrlComponent label="Port" value={parsed.port || '(Default)'} onCopy={() => handleCopy(parsed.port, 'Port')} />
                            <UrlComponent label="Pathname" value={parsed.pathname} onCopy={() => handleCopy(parsed.pathname, 'Pathname')} />
                            <UrlComponent label="Hash" value={parsed.hash} onCopy={() => handleCopy(parsed.hash, 'Hash')} />
                            <UrlComponent label="Origin" value={parsed.origin} onCopy={() => handleCopy(parsed.origin, 'Origin')} />
                        </CardContent>
                    </Card>

                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                Query Parameters
                                <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {params.length} params
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            {params.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">Key</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {params.map(([key, value], idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium font-mono text-xs">{key}</TableCell>
                                                <TableCell className="font-mono text-xs break-all">{value}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(value, key)}>
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-8 italic">
                                    No query parameters found
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

function UrlComponent({ label, value, onCopy }: { label: string, value: string, onCopy: () => void }) {
    if (!value) return null
    return (
        <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors group">
            <div className="space-y-0.5 overflow-hidden">
                <p className="text-xs text-muted-foreground font-medium uppercase">{label}</p>
                <p className="text-sm font-mono truncate" title={value}>{value}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onCopy}>
                <Copy className="h-3 w-3" />
            </Button>
        </div>
    )
}
