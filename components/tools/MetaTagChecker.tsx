'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { performMetaTagLookup } from '@/lib/actions/tools'
import { toast } from 'sonner'
import { Loader2, Search, ImageIcon, LayoutTemplate, Globe, Share2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function MetaTagChecker() {
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

        const res = await performMetaTagLookup(url)

        if (res.error) {
            setError(res.error)
            toast.error(res.error)
        } else {
            setResult(res.data)
            toast.success('Meta tags fetched successfully!')
        }

        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Meta Tag Checker</CardTitle>
                    <CardDescription>Analyze SEO and Social Media meta tags for any URL.</CardDescription>
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
                            Check Tags
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
                <Tabs defaultValue="basic" className="animate-in fade-in slide-in-from-bottom-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic SEO</TabsTrigger>
                        <TabsTrigger value="social">Social Media (OG)</TabsTrigger>
                        <TabsTrigger value="preview">Previews</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary" />
                                    Essential Tags
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <MetaItem label="Title" value={result.title} />
                                <MetaItem label="Description" value={result.description} />
                                <MetaItem label="Keywords" value={result.keywords} />
                                <MetaItem label="Canonical URL" value={result.canonical} />
                                <MetaItem label="Favicon" value={result.favicon} isImage />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-4 pt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Share2 className="h-4 w-4 text-blue-500" />
                                        Open Graph (Facebook/LinkedIn)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <MetaItem label="og:title" value={result.og.title} />
                                    <MetaItem label="og:description" value={result.og.description} />
                                    <MetaItem label="og:image" value={result.og.image} isImage />
                                    <MetaItem label="og:type" value={result.og.type} />
                                    <MetaItem label="og:site_name" value={result.og.site_name} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <LayoutTemplate className="h-4 w-4 text-sky-500" />
                                        Twitter Card
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <MetaItem label="twitter:card" value={result.twitter.card} />
                                    <MetaItem label="twitter:title" value={result.twitter.title} />
                                    <MetaItem label="twitter:description" value={result.twitter.description} />
                                    <MetaItem label="twitter:image" value={result.twitter.image} isImage />
                                    <MetaItem label="twitter:site" value={result.twitter.site} />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="preview" className="pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Google Search Result Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-[600px] font-sans">
                                    <div className="group cursor-pointer">
                                        <div className="text-sm text-[#202124] flex items-center gap-2 mb-1">
                                            {result.favicon && (
                                                <img src={result.favicon.startsWith('/') ? new URL(result.favicon, url).toString() : result.favicon} className="w-4 h-4 rounded-full bg-gray-100" onError={(e) => e.currentTarget.style.display = 'none'} />
                                            )}
                                            <span className="truncate">{url}</span>
                                            <span className="text-gray-500 text-xs">⋮</span>
                                        </div>
                                        <h3 className="text-xl text-[#1a0dab] group-hover:underline truncate">{result.title || 'No Title'}</h3>
                                    </div>
                                    <p className="text-sm text-[#4d5156] mt-1 line-clamp-2">
                                        {result.description || 'No description available for this page.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}

function MetaItem({ label, value, isImage }: { label: string, value: string, isImage?: boolean }) {
    if (!value) return null
    return (
        <div className="space-y-1 border-b last:border-0 pb-3 last:pb-0">
            <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
            {isImage ? (
                <div className="mt-2">
                    <p className="font-mono text-xs break-all text-muted-foreground mb-2">{value}</p>
                    {/* Try to resolve relative URLs if needed, but for now display raw. The actual img tag needs absolute */}
                    <div className="relative h-32 w-full max-w-[200px] rounded-lg overflow-hidden border bg-muted/50">
                        <img
                            src={value}
                            alt={label}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center')
                                e.currentTarget.parentElement!.innerText = 'Image not loadable'
                            }}
                        />
                    </div>
                </div>
            ) : (
                <p className="text-sm break-words">{value}</p>
            )}
        </div>
    )
}
