'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Hash, Trash2 } from 'lucide-react'

export function HexConverter() {
    const [textInput, setTextInput] = useState('')
    const [hexOutput, setHexOutput] = useState('')

    const [decimalInput, setDecimalInput] = useState('')
    const [hexNumOutput, setHexNumOutput] = useState('')

    // Text <-> Hex
    const handleTextToHex = (txt: string) => {
        setTextInput(txt)
        let hex = ''
        for (let i = 0; i < txt.length; i++) {
            hex += txt.charCodeAt(i).toString(16).padStart(2, '0') + ' '
        }
        setHexOutput(hex.trim())
    }

    const handleHexToText = (hex: string) => {
        setHexOutput(hex)
        const cleanHex = hex.replace(/\s+/g, '')
        if (cleanHex.length % 2 !== 0) return // Incomplete

        try {
            let str = ''
            for (let i = 0; i < cleanHex.length; i += 2) {
                str += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16))
            }
            setTextInput(str)
        } catch (e) {
            // Ignore invalid
        }
    }

    // Decimal <-> Hex
    const handleDecToHex = (dec: string) => {
        setDecimalInput(dec)
        try {
            if (!dec) {
                setHexNumOutput('')
                return
            }
            const num = BigInt(dec)
            setHexNumOutput(num.toString(16).toUpperCase())
        } catch (e) {
            // Not a number
        }
    }

    const handleHexNumToDec = (hex: string) => {
        setHexNumOutput(hex)
        try {
            if (!hex) {
                setDecimalInput('')
                return
            }
            // Add 0x if missing
            const prefix = hex.startsWith('0x') ? '' : '0x'
            const num = BigInt(prefix + hex)
            setDecimalInput(num.toString())
        } catch (e) {
            // Invalid hex
        }
    }

    const copy = (txt: string) => {
        navigator.clipboard.writeText(txt)
        toast.success('Copied')
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="text">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">Text &lt;-&gt; Hex String</TabsTrigger>
                    <TabsTrigger value="decimal">Decimal &lt;-&gt; Hex Number</TabsTrigger>
                </TabsList>

                {/* Text Converters */}
                <TabsContent value="text" className="grid gap-6 md:grid-cols-2 min-h-[400px]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Text Input</CardTitle>
                            <CardDescription>Enter plain text.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Hello"
                                className="h-64 resize-none"
                                value={textInput}
                                onChange={e => handleTextToHex(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Hex Output</CardTitle>
                            <CardDescription>Hexadecimal string representation.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <Textarea
                                placeholder="48 65 6c 6c 6f"
                                className="h-64 font-mono resize-none"
                                value={hexOutput}
                                onChange={e => handleHexToText(e.target.value)}
                            />
                            <Button onClick={() => copy(hexOutput)} disabled={!hexOutput}>
                                <Copy className="h-4 w-4 mr-2" /> Copy Hex
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Number Converters */}
                <TabsContent value="decimal" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                Decimal / Hex Number Converter
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Decimal (Base 10)</label>
                                <Textarea
                                    className="resize-none font-mono text-lg"
                                    placeholder="255"
                                    value={decimalInput}
                                    onChange={e => handleDecToHex(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Hexadecimal (Base 16)</label>
                                <Textarea
                                    className="resize-none font-mono text-lg uppercase"
                                    placeholder="FF"
                                    value={hexNumOutput}
                                    onChange={e => handleHexNumToDec(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
