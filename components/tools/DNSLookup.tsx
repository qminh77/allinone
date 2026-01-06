'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { performDnsLookup, DnsRecordType } from '@/lib/actions/tools'
import { Loader2, Search, Copy, Globe, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const RECORD_TYPES: DnsRecordType[] = ['A', 'AAAA', 'MX', 'CNAME', 'NS', 'TXT', 'SOA']

export function DNSLookup() {
    const [domain, setDomain] = useState('')
    const [recordType, setRecordType] = useState<DnsRecordType>('A')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [searchedDomain, setSearchedDomain] = useState('')
    const [searchedType, setSearchedType] = useState<DnsRecordType>('A')

    const handleLookup = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!domain) return

        setLoading(true)
        setError(null)
        setResults(null)
        setSearchedDomain(domain)
        setSearchedType(recordType)

        const res = await performDnsLookup(domain, recordType)

        if (res.error) {
            setError(res.error)
            toast.error(res.error)
        } else {
            setResults(res.data)
            if (Array.isArray(res.data) && res.data.length === 0) {
                toast.info('Không tìm thấy bản ghi nào.')
            } else {
                toast.success('Tra cứu thành công!')
            }
        }

        setLoading(false)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Đã sao chép!')
    }

    // Helper to render cell content based on result type
    const renderResultValue = (val: any) => {
        if (typeof val === 'object' && val !== null) {
            return (
                <div className="grid gap-2">
                    {Object.entries(val).map(([k, v]) => (
                        <div key={k} className="flex flex-col sm:flex-row sm:gap-2 text-sm bg-muted/50 p-2 rounded">
                            <span className="font-semibold text-muted-foreground min-w-[80px] capitalize">{k}:</span>
                            <span className="font-mono text-foreground break-all">{String(v)}</span>
                        </div>
                    ))}
                </div>
            )
        }
        return <span className="font-mono text-sm break-all">{val}</span>
    }

    return (
        <div className="grid gap-6">
            {/* Input Toolbar */}
            <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
                <CardContent className="p-0 sm:p-6">
                    <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Nhập tên miền (vd: umt.edu.vn)"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                className="h-10 sm:h-11 font-mono"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Select value={recordType} onValueChange={(v) => setRecordType(v as DnsRecordType)}>
                                <SelectTrigger className="w-[100px] sm:w-[140px] h-10 sm:h-11 font-semibold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {RECORD_TYPES.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="submit" disabled={loading || !domain} className="h-10 sm:h-11 px-4 sm:px-8">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                    <>
                                        <Search className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">Tra cứu</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Results Section */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {results && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-primary" />
                                    Kết quả phân giải
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono">{searchedDomain}</Badge>
                                    <Badge variant="secondary">{searchedType}</Badge>
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}>
                                <Copy className="h-3 w-3 sm:mr-2" />
                                <span className="hidden sm:inline">JSON</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {Array.isArray(results) && results.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                    <h3 className="text-lg font-medium text-foreground">Không tìm thấy bản ghi</h3>
                                    <p>Không có bản ghi {searchedType} nào cho tên miền này.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[50px] text-center">#</TableHead>
                                            <TableHead>Giá trị bản ghi</TableHead>
                                            <TableHead className="w-[100px] text-right">TTL</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.isArray(results) ? results.map((item: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-center font-medium text-muted-foreground">{i + 1}</TableCell>
                                                <TableCell className="font-mono text-sm">{renderResultValue(item)}</TableCell>
                                                <TableCell className="text-right font-mono text-xs text-muted-foreground">Auto</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell className="text-center font-medium text-muted-foreground">1</TableCell>
                                                <TableCell className="font-mono text-sm">{renderResultValue(results)}</TableCell>
                                                <TableCell className="text-right font-mono text-xs text-muted-foreground">Auto</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {!results && !error && !loading && (
                <div className="text-center py-12 text-muted-foreground opacity-50">
                    <Search className="h-12 w-12 mx-auto mb-4" />
                    <p>Nhập tên miền và chọn loại bản ghi để bắt đầu</p>
                </div>
            )}
        </div>
    )
}
