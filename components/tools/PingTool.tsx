'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Activity, Server, Globe } from 'lucide-react'
import { pingSite, checkPort, PingResult, PortCheckResult } from '@/lib/actions/ping'
import { cn } from '@/lib/utils'

export function PingTool() {
    // Site Ping States
    const [url, setUrl] = useState('')
    const [siteResult, setSiteResult] = useState<PingResult | null>(null)
    const [siteLoading, setSiteLoading] = useState(false)

    // Port Check States
    const [host, setHost] = useState('')
    const [port, setPort] = useState('')
    const [portResult, setPortResult] = useState<PortCheckResult | null>(null)
    const [portLoading, setPortLoading] = useState(false)

    const handlePingSite = async () => {
        if (!url) return
        setSiteLoading(true)
        setSiteResult(null)
        try {
            const res = await pingSite(url)
            setSiteResult(res)
        } finally {
            setSiteLoading(false)
        }
    }

    const handleCheckPort = async () => {
        if (!host || !port) return
        setPortLoading(true)
        setPortResult(null)
        try {
            const res = await checkPort(host, parseInt(port))
            setPortResult(res)
        } finally {
            setPortLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="site" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="site" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website Ping (HTTP)
                    </TabsTrigger>
                    <TabsTrigger value="port" className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Port Check (TCP)
                    </TabsTrigger>
                </TabsList>

                {/* Website Ping Tab */}
                <TabsContent value="site" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kiểm tra trạng thái Website</CardTitle>
                            <CardDescription>
                                Gửi yêu cầu HTTP HEAD đến website để kiểm tra khả năng truy cập và độ trễ.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nhập URL (ví dụ: google.com)..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePingSite()}
                                />
                                <Button onClick={handlePingSite} disabled={siteLoading}>
                                    {siteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
                                    Ping
                                </Button>
                            </div>

                            {siteResult && (
                                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="font-semibold">{siteResult.host}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {siteResult.error ? (
                                                <span className="text-destructive">{siteResult.error}</span>
                                            ) : (
                                                <span>Status Code: {siteResult.statusCode}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={siteResult.status === 'online' ? 'default' : 'destructive'}>
                                            {siteResult.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                                        </Badge>
                                        {siteResult.latency > 0 && (
                                            <span className={cn(
                                                "text-sm font-mono",
                                                siteResult.latency < 200 ? "text-green-500" :
                                                    siteResult.latency < 500 ? "text-yellow-500" : "text-red-500"
                                            )}>
                                                {siteResult.latency}ms
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Port Check Tab */}
                <TabsContent value="port" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kiểm tra Open Port</CardTitle>
                            <CardDescription>
                                Kiểm tra xem một cổng (port) cụ thể có đang mở trên máy chủ hay không.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    className="flex-1"
                                    placeholder="Host / Domain (ví dụ: 8.8.8.8)"
                                    value={host}
                                    onChange={(e) => setHost(e.target.value)}
                                />
                                <Input
                                    className="w-24"
                                    type="number"
                                    placeholder="Port"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCheckPort()}
                                />
                                <Button onClick={handleCheckPort} disabled={portLoading}>
                                    {portLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Server className="mr-2 h-4 w-4" />}
                                    Check
                                </Button>
                            </div>

                            {portResult && (
                                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="font-semibold">{portResult.host}:{portResult.port}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {portResult.error ? (
                                                <span className="text-destructive">{portResult.error}</span>
                                            ) : (
                                                <span className="text-muted-foreground">Connection established</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={portResult.status === 'open' ? 'default' : 'destructive'}>
                                            {portResult.status === 'open' ? 'OPEN' : 'CLOSED'}
                                        </Badge>
                                        {portResult.latency > 0 && (
                                            <span className="text-sm font-mono text-green-500">
                                                {portResult.latency}ms
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
