'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Search, Globe, Calendar, Server, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { performWhoisLookup, WhoisLookupResponse } from '@/lib/actions/whois'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function WhoisLookup() {
    const [domain, setDomain] = useState('')
    const [result, setResult] = useState<WhoisLookupResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [rawOpen, setRawOpen] = useState(false)

    const handleLookup = async () => {
        if (!domain) return
        setLoading(true)
        setResult(null)
        setRawOpen(false)
        try {
            const data = await performWhoisLookup(domain)
            setResult(data)
        } catch (error) {
            setResult({ success: false, error: 'Failed to perform lookup' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Tra cứu Whois</CardTitle>
                    <CardDescription>
                        Kiểm tra thông tin chủ sở hữu và nhà đăng ký tên miền
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nhập tên miền (ví dụ: google.com)..."
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                        />
                        <Button onClick={handleLookup} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Tra cứu
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {result?.error && (
                <Alert variant="destructive">
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>{result.error}</AlertDescription>
                </Alert>
            )}

            {result?.success && result.data && (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Status Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Tên miền
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{result.data.domainName || domain}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {result.data.registrar ? `Registrar: ${result.data.registrar}` : 'Registrar: Không xác định'}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dates Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Thời gian
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Ngày đăng ký:</span>
                                    <span className="font-medium">{result.data.creationDate || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Ngày hết hạn:</span>
                                    <span className="font-medium">{result.data.expiryDate || 'N/A'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Raw Output Collapsible */}
                    <Card>
                        <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
                            <div className="flex items-center justify-between p-4 border-b">
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    <FileText className="h-4 w-4" />
                                    Dữ liệu thô (Raw Output)
                                </div>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-9 p-0">
                                        {rawOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        <span className="sr-only">Toggle</span>
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent>
                                <div className="p-4 bg-muted/50 overflow-x-auto">
                                    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed space-y-2 text-muted-foreground">
                                        {result.data.raw}
                                    </pre>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>
                </div>
            )}
        </div>
    )
}
