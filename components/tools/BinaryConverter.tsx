'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowRightLeft, Binary, Copy, Trash2, Type } from 'lucide-react'

export function BinaryConverter() {
    const [textInput, setTextInput] = useState('')
    const [binaryInput, setBinaryInput] = useState('')

    const handleTextToBinary = () => {
        if (!textInput) return
        const binary = textInput.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0')
        }).join(' ')
        setBinaryInput(binary)
        toast.success('Converted to Binary')
    }

    const handleBinaryToText = () => {
        if (!binaryInput) return
        try {
            const text = binaryInput.split(' ').map(bin => {
                return String.fromCharCode(parseInt(bin, 2))
            }).join('')
            setTextInput(text)
            toast.success('Converted to Text')
        } catch (e) {
            toast.error('Invalid Binary format')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied')
    }

    const clearAll = () => {
        setTextInput('')
        setBinaryInput('')
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 h-[calc(100vh-200px)] min-h-[600px]">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Text Input
                    </CardTitle>
                    <CardDescription>Enter plain text here.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
                    <Textarea
                        placeholder="Hello World"
                        className="flex-1 resize-none p-4"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                    />
                    <div className="flex justify-between">
                        <Button variant="outline" size="icon" onClick={clearAll} title="Clear All">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex gap-2">
                            <Button onClick={handleTextToBinary}>
                                To Binary <ArrowRightLeft className="h-4 w-4 ml-2" />
                            </Button>
                            <Button variant="secondary" onClick={() => copyToClipboard(textInput)} disabled={!textInput}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Binary className="h-4 w-4" />
                        Binary Output
                    </CardTitle>
                    <CardDescription>Space-separated 8-bit binary.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
                    <Textarea
                        placeholder="01001000 01100101 01101100 01101100 01101111"
                        className="flex-1 font-mono resize-none p-4 bg-muted/30"
                        value={binaryInput}
                        onChange={(e) => setBinaryInput(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button onClick={handleBinaryToText} variant="outline">
                            <ArrowRightLeft className="h-4 w-4 mr-2" /> To Text
                        </Button>
                        <Button variant="secondary" onClick={() => copyToClipboard(binaryInput)} disabled={!binaryInput}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
