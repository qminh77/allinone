'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from "@/components/ui/slider"
import { Loader2, Copy, Check, RefreshCw, Fingerprint } from 'lucide-react'
import { generateUuid } from '@/lib/actions/crypto'

export function UuidGenerator() {
    const [uuids, setUuids] = useState<string[]>([])
    const [quantity, setQuantity] = useState([1])
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await generateUuid(quantity[0])
            setUuids(res)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (uuids.length === 0) return
        navigator.clipboard.writeText(uuids.join('\n'))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Generate on mount or first interaction? Let's wait for user interaction to avoid hydration mismatch if random
    // But we can generate one initially in useEffect if needed. For now, manual is fine.

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>UUID v4 Generator</CardTitle>
                    <CardDescription>
                        Tạo mã định danh duy nhất (Universally Unique Identifier) phiên bản 4.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Số lượng: {quantity[0]}</Label>
                            <span className="text-sm text-muted-foreground">Tối đa 50</span>
                        </div>
                        <Slider
                            value={quantity}
                            onValueChange={setQuantity}
                            max={50}
                            min={1}
                            step={1}
                            className="py-4"
                        />
                    </div>

                    <Button onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Tạo UUID
                    </Button>

                    {uuids.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center">
                                <Label>Kết quả</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyToClipboard}
                                    className="h-8 px-2"
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                    {copied ? 'Copied' : 'Copy All'}
                                </Button>
                            </div>
                            <Textarea
                                value={uuids.join('\n')}
                                readOnly
                                className="font-mono bg-muted min-h-[150px]"
                                rows={Math.min(uuids.length + 1, 15)}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
