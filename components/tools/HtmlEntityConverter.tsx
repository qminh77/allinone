'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowRightLeft, Code, Copy, Trash2 } from 'lucide-react'
import he from 'he'

export function HtmlEntityConverter() {
    const [input, setInput] = useState('')
    const [mode, setMode] = useState<'encode' | 'decode'>('encode')

    const process = (text: string, currentMode: 'encode' | 'decode') => {
        try {
            if (currentMode === 'encode') {
                return he.encode(text, { useNamedReferences: true })
            } else {
                return he.decode(text)
            }
        } catch (e) {
            return 'Error processing text'
        }
    }

    const output = process(input, mode)

    const handleCopy = () => {
        navigator.clipboard.writeText(output)
        toast.success('Copied to clipboard')
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 h-[calc(100vh-200px)] min-h-[600px]">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Input ({mode === 'encode' ? 'Text' : 'Encoded HTML'})
                    </CardTitle>
                    <CardDescription>
                        Type or paste your content here.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
                    <div className="flex gap-2">
                        <Button
                            variant={mode === 'encode' ? 'default' : 'outline'}
                            onClick={() => setMode('encode')}
                            size="sm"
                        >
                            Encode
                        </Button>
                        <Button
                            variant={mode === 'decode' ? 'default' : 'outline'}
                            onClick={() => setMode('decode')}
                            size="sm"
                        >
                            Decode
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setInput('')} title="Clear" className="ml-auto">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <Textarea
                        placeholder={mode === 'encode' ? '<p>Hello & World</p>' : '&lt;p&gt;Hello &amp; World&lt;/p&gt;'}
                        className="flex-1 font-mono resize-none p-4 text-sm"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </CardContent>
            </Card>

            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4" />
                        Output ({mode === 'encode' ? 'Encoded HTML' : 'Text'})
                    </CardTitle>
                    <CardDescription>
                        Result will appear here automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleCopy} disabled={!output}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                        </Button>
                    </div>
                    <Textarea
                        readOnly
                        placeholder="Result..."
                        className="flex-1 font-mono resize-none p-4 text-sm bg-muted/30"
                        value={output}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
