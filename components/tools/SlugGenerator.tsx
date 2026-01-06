'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check, RotateCcw } from 'lucide-react'

export function SlugGenerator() {
    const [input, setInput] = useState('')
    const [slug, setSlug] = useState('')
    const [separator, setSeparator] = useState('-')
    const [lowercase, setLowercase] = useState(true)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        generateSlug(input)
    }, [input, separator, lowercase])

    const generateSlug = (text: string) => {
        let result = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents

        if (lowercase) {
            result = result.toLowerCase()
        }

        result = result
            .replace(/[^a-z0-9\s-]/gi, '') // Remove special characters
            .trim()
            .replace(/\s+/g, separator) // Replace spaces with separator
            .replace(new RegExp(`\\${separator}+`, 'g'), separator) // Remove duplicate separators

        setSlug(result)
    }

    const copyToClipboard = () => {
        if (!slug) return
        navigator.clipboard.writeText(slug)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleReset = () => {
        setInput('')
        setSlug('')
        setCopied(false)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Slug Generator</CardTitle>
                    <CardDescription>
                        Chuyển đổi văn bản thành URL slug thân thiện với SEO.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="input">Văn bản đầu vào</Label>
                        <Textarea
                            id="input"
                            placeholder="Nhập tiêu đề bài viết hoặc văn bản cần chuyển đổi..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                        <div className="space-y-2 flex-1">
                            <Label>Ký tự ngăn cách</Label>
                            <Select value={separator} onValueChange={setSeparator}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="-">Gạch ngang (-)</SelectItem>
                                    <SelectItem value="_">Gạch dưới (_)</SelectItem>
                                    <SelectItem value=".">Dấu chấm (.)</SelectItem>
                                    <SelectItem value="">Không có khoảng cách</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 pb-2">
                            <Switch
                                id="lowercase"
                                checked={lowercase}
                                onCheckedChange={setLowercase}
                            />
                            <Label htmlFor="lowercase">Chuyển thành chữ thường</Label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Kết quả Slug</Label>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    disabled={!input}
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={copyToClipboard}
                                    disabled={!slug}
                                >
                                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                    {copied ? 'Đã copy' : 'Copy Result'}
                                </Button>
                            </div>
                        </div>
                        <div className="relative">
                            <Textarea
                                value={slug}
                                readOnly
                                className="font-mono bg-muted min-h-[60px]"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
