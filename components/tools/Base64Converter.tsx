'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowRightLeft, Copy, Check, Hash, FileCode } from 'lucide-react'
import { toBase64, fromBase64 } from '@/lib/actions/converters'

export function Base64Converter() {
    // Encode State
    const [encodeInput, setEncodeInput] = useState('')
    const [encodeOutput, setEncodeOutput] = useState('')
    const [encodeLoading, setEncodeLoading] = useState(false)
    const [encodeCopied, setEncodeCopied] = useState(false)

    // Decode State
    const [decodeInput, setDecodeInput] = useState('')
    const [decodeOutput, setDecodeOutput] = useState('')
    const [decodeLoading, setDecodeLoading] = useState(false)
    const [decodeCopied, setDecodeCopied] = useState(false)

    const handleEncode = async () => {
        if (!encodeInput) return
        setEncodeLoading(true)
        try {
            const res = await toBase64(encodeInput)
            setEncodeOutput(res)
        } finally {
            setEncodeLoading(false)
        }
    }

    const handleDecode = async () => {
        if (!decodeInput) return
        setDecodeLoading(true)
        try {
            const res = await fromBase64(decodeInput)
            setDecodeOutput(res)
        } finally {
            setDecodeLoading(false)
        }
    }

    const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
        if (!text) return
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="encode" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="encode" className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Encode (Text &rarr; Base64)
                    </TabsTrigger>
                    <TabsTrigger value="decode" className="flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        Decode (Base64 &rarr; Text)
                    </TabsTrigger>
                </TabsList>

                {/* Encode Tab */}
                <TabsContent value="encode" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Base64 Encode</CardTitle>
                            <CardDescription>
                                Chuyển đổi văn bản thông thường sang định dạng Base64.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Input Text</Label>
                                <Textarea
                                    placeholder="Enter text to encode..."
                                    value={encodeInput}
                                    onChange={(e) => setEncodeInput(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <Button onClick={handleEncode} disabled={encodeLoading || !encodeInput}>
                                {encodeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                                Encode
                            </Button>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Encoded Output</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(encodeOutput, setEncodeCopied)}
                                        disabled={!encodeOutput}
                                        className="h-8 px-2"
                                    >
                                        {encodeCopied ? <Check className="h-4 w-4 text-green-500 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                        {encodeCopied ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>
                                <Textarea
                                    value={encodeOutput}
                                    readOnly
                                    className="font-mono bg-muted"
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Decode Tab */}
                <TabsContent value="decode" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Base64 Decode</CardTitle>
                            <CardDescription>
                                Giải mã chuỗi Base64 về dạng văn bản gốc.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Base64 String</Label>
                                <Textarea
                                    placeholder="Enter Base64 string to decode..."
                                    value={decodeInput}
                                    onChange={(e) => setDecodeInput(e.target.value)}
                                    rows={4}
                                    className="font-mono"
                                />
                            </div>

                            <Button onClick={handleDecode} disabled={decodeLoading || !decodeInput}>
                                {decodeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                                Decode
                            </Button>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Decoded Output</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(decodeOutput, setDecodeCopied)}
                                        disabled={!decodeOutput}
                                        className="h-8 px-2"
                                    >
                                        {decodeCopied ? <Check className="h-4 w-4 text-green-500 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                        {decodeCopied ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>
                                <Textarea
                                    value={decodeOutput}
                                    readOnly
                                    className="bg-muted"
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
