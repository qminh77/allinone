'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Copy, Check, Hash } from 'lucide-react'
import { generateMd5 } from '@/lib/actions/crypto'
import { Label } from '@/components/ui/label'

export function Md5Generator() {
    const [input, setInput] = useState('')
    const [hash, setHash] = useState('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleGenerate = async () => {
        if (!input) {
            setHash('')
            return
        }
        setLoading(true)
        try {
            const res = await generateMd5(input)
            setHash(res)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        if (!hash) return
        navigator.clipboard.writeText(hash)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Tạo mã MD5</CardTitle>
                    <CardDescription>
                        Mã hóa văn bản thành chuỗi MD5 (Message Digest Algorithm 5)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Văn bản cần mã hóa</Label>
                        <Textarea
                            placeholder="Nhập nội dung..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <Button onClick={handleGenerate} disabled={loading || !input}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Hash className="mr-2 h-4 w-4" />}
                        Tạo MD5
                    </Button>

                    {hash && (
                        <div className="space-y-2 pt-4">
                            <Label>Kết quả (MD5 Hash)</Label>
                            <div className="flex gap-2">
                                <Input value={hash} readOnly className="font-mono bg-muted" />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopy}
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
