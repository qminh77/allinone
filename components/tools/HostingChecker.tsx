'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Search, Server, MapPin, Globe, ShieldCheck, Network } from 'lucide-react'
import { performIpLookup } from '@/lib/actions/tools'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function HostingChecker() {
    const [domain, setDomain] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!domain.trim()) {
            toast.error('Vui lòng nhập tên miền')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        // Basic clean up: remove http/https, www, trailing slash
        const cleanDomain = domain
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '')

        const res = await performIpLookup(cleanDomain)

        if (res.error) {
            setError(res.error)
            toast.error(res.error)
        } else {
            setResult(res.data)
            toast.success('Kiểm tra thành công!')
        }

        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Website Hosting Checker</CardTitle>
                    <CardDescription>
                        Kiểm tra thông tin nhà cung cấp Hosting, vị trí máy chủ và IP của website.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCheck} className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="domain" className="sr-only">Domain</Label>
                            <Input
                                id="domain"
                                placeholder="google.com"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                            Check Hosting
                        </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Hosting Provider - Key Info */}
                    <Card className="md:col-span-2 lg:col-span-2 border-primary/20 bg-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Server className="h-5 w-5 text-primary" />
                                Hosting Provider
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">ISP / Organization</p>
                                    <p className="text-2xl font-bold text-primary mt-1">{result.isp}</p>
                                    <p className="text-sm text-muted-foreground">{result.org}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">AS Name / Number</p>
                                    <p className="text-xl font-semibold mt-1">{result.as}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                Server Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground text-sm">Country</span>
                                <span className="font-medium flex items-center gap-2">
                                    {result.country}
                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{result.countryCode}</span>
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground text-sm">Region / State</span>
                                <span className="font-medium">{result.regionName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm">City</span>
                                <span className="font-medium">{result.city}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical / Network Info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Network className="h-4 w-4 text-muted-foreground" />
                                Network Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground text-sm">IP Address</span>
                                <span className="font-mono font-medium">{result.query}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground text-sm">Timezone</span>
                                <span className="font-medium">{result.timezone}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm">Coordinates</span>
                                <span className="font-mono text-xs">{result.lat}, {result.lon}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status / Trust (Visual Filler mostly, but based on success) */}
                    <Card className="bg-green-500/5 border-green-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                                <ShieldCheck className="h-4 w-4" />
                                Lookup Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-green-600 dark:text-green-300">
                                Successfully resolved host information for <strong>{domain}</strong>.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
