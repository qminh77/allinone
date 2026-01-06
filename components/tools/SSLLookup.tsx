'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, CheckCircle, XCircle, Shield } from 'lucide-react'
import { performSslLookup, SslLookupResult } from '@/lib/actions/ssl'

export function SSLLookup() {
    const [domain, setDomain] = useState('')
    const [result, setResult] = useState<SslLookupResult | null>(null)
    const [loading, setLoading] = useState(false)

    const handleLookup = async () => {
        if (!domain) return
        setLoading(true)
        setResult(null)
        try {
            const data = await performSslLookup(domain)
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
                    <CardTitle>Kiểm tra SSL/TLS</CardTitle>
                    <CardDescription>
                        Kiểm tra thông tin chứng chỉ bảo mật của website
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
                            Kiểm tra
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {result?.error && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>{result.error}</AlertDescription>
                </Alert>
            )}

            {result?.success && result.data && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="md:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
                            {result.data.valid ? (
                                <Badge className="bg-green-500 hover:bg-green-600">Hợp lệ</Badge>
                            ) : (
                                <Badge variant="destructive">Không hợp lệ / Hết hạn</Badge>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{result.data.host}</div>
                            <p className="text-xs text-muted-foreground">
                                Còn {result.data.daysRemaining} ngày sử dụng
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Thông tin chứng chỉ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">Cấp bởi:</span>
                                <span className="font-medium text-right">{result.data.issuer}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">Cấp cho:</span>
                                <span className="font-medium text-right">{result.data.subject}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">Serial Number:</span>
                                <span className="font-medium text-right font-mono text-xs max-w-[200px] truncate" title={result.data.serialNumber}>{result.data.serialNumber}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Thời hạn
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">Hiệu lực từ:</span>
                                <span className="font-medium">
                                    {new Date(result.data.validFrom).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">Hết hạn vào:</span>
                                <span className="font-medium">
                                    {new Date(result.data.validTo).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
