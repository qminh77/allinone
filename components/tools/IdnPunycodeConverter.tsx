'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Globe2, ArrowRightLeft, Copy, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import punycode from 'punycode'

export function IdnPunycodeConverter() {
    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')
    const [mode, setMode] = useState<'toAscii' | 'toUnicode'>('toAscii')

    const convert = () => {
        if (!input) return

        try {
            let result = ''
            if (mode === 'toAscii') {
                result = punycode.toASCII(input)
            } else {
                result = punycode.toUnicode(input)
            }
            setOutput(result)
            toast.success('Converted successfully')
        } catch (error) {
            toast.error('Conversion failed. Invalid input.')
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(output)
        toast.success('Copied result')
    }

    const toggleMode = () => {
        setMode(prev => prev === 'toAscii' ? 'toUnicode' : 'toAscii')
        // Automatically swap input/output if output exists
        if (output) {
            setInput(output)
            setOutput(input) // naive swap
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Input</CardTitle>
                    <CardDescription>
                        {mode === 'toAscii' ? 'Enter Unicode Domain (e.g. mã-u.vn)' : 'Enter Punycode Domain (e.g. xn--m-u-8laz.vn)'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder={mode === 'toAscii' ? "mã-u.vn" : "xn--m-u-8laz.vn"}
                        className="min-h-[120px] font-mono text-base"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <Button onClick={convert} disabled={!input}>
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Convert to {mode === 'toAscii' ? 'Punycode' : 'Unicode'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setInput('')} title="Clear">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        Output
                        <Button variant="ghost" size="sm" onClick={toggleMode} className="text-xs">
                            Switch Mode <ArrowRightLeft className="h-3 w-3 ml-1" />
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        Result in {mode === 'toAscii' ? 'Punycode' : 'Unicode'} format.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Textarea
                            readOnly
                            className="min-h-[120px] font-mono text-base bg-muted/50"
                            value={output}
                            placeholder="Result will appear here..."
                        />
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute bottom-2 right-2 h-8 w-8"
                            onClick={handleCopy}
                            disabled={!output}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
