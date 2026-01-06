'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { performIpLookup } from '@/lib/actions/tools'
import { Loader2, Search, MapPin, Globe, Network, Building, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function IPLookup() {
    const [ip, setIp] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleLookup = async (e?: React.FormEvent, customIp?: string) => {
        e?.preventDefault()
        const query = customIp ?? ip

        // Allow empty query to find own IP (handled by backend or API usually implies requester IP if empty, 
        // but our action defaults to empty string. Let's send empty string for "my ip")

        setLoading(true)
        setError(null)
        setResult(null)

        const res = await performIpLookup(query)

        if (res.error) {
            setError(res.error)
            toast.error(res.error)
        } else {
            setResult(res.data)
            toast.success('Tra cứu thành công!')
            if (!ip && res.data.query) {
                setIp(res.data.query)
            }
        }

        setLoading(false)
    }

    const triggerMyIp = () => {
        setIp('')
        handleLookup(undefined, '')
    }

    return (
        <div className="grid gap-6">
            <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
                <CardContent className="p-0 sm:p-6">
                    <form onSubmit={(e) => handleLookup(e)} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Nhập địa chỉ IP (để trống để xem IP của bạn)"
                                value={ip}
                                onChange={(e) => setIp(e.target.value)}
                                className="h-10 sm:h-11 font-mono"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={triggerMyIp} className="h-10 sm:h-11 border-dashed">
                                IP của tôi
                            </Button>
                            <Button type="submit" disabled={loading} className="h-10 sm:h-11 min-w-[100px]">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                    <>
                                        <Search className="h-4 w-4 mr-2" />
                                        Tra cứu
                                    </>
                                )}
                            </Button>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Main Info Card */}
                    <Card className="md:col-span-2 lg:col-span-2 border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Network className="h-5 w-5 text-primary" />
                                Thông tin chung
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Địa chỉ IP</p>
                                <p className="text-2xl font-bold font-mono text-primary">{result.query}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">ISP (Nhà mạng)</p>
                                <p className="text-lg font-medium">{result.isp}</p>
                                <p className="text-xs text-muted-foreground">{result.org}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                Vị trí
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Quốc gia</span>
                                <span className="font-medium text-right">{result.country} ({result.countryCode})</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Khu vực</span>
                                <span className="font-medium text-right">{result.regionName}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Thành phố</span>
                                <span className="font-medium text-right">{result.city}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Zip Code</span>
                                <span className="font-medium text-right font-mono">{result.zip}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                Chi tiết kỹ thuật
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">AS Number</span>
                                <span className="font-medium text-right font-mono">{result.as}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Timezone</span>
                                <span className="font-medium text-right">{result.timezone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Coordinates</span>
                                <span className="font-medium text-right font-mono text-xs">{result.lat}, {result.lon}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {!result && !error && !loading && (
                <div className="text-center py-12 text-muted-foreground opacity-50">
                    <Globe className="h-12 w-12 mx-auto mb-4" />
                    <p>Nhập địa chỉ IP để bắt đầu tra cứu</p>
                </div>
            )}
        </div>
    )
}
