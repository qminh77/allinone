'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Copy, Check, FileCode, RotateCcw, ArrowRightLeft } from 'lucide-react'

export function JsMinifier() {
    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')
    const [copied, setCopied] = useState(false)

    const handleMinify = () => {
        if (!input) return

        // Basic JS minification regex (Use with caution for complex JS)
        let minified = input
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .replace(/\/\/.*/g, '') // Remove single-line comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*([\{\}\(\)\[\]\=\+\-\*\/\%\!\&\|\<\>\?\,\:\;])\s*/g, '$1') // Remove space around operators
            .trim()

        setOutput(minified)
    }

    const copyToClipboard = () => {
        if (!output) return
        navigator.clipboard.writeText(output)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleReset = () => {
        setInput('')
        setOutput('')
        setCopied(false)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>JS Minifier</CardTitle>
                    <CardDescription>
                        Nén mã JavaScript đơn giản (Basic Minification).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="input">JavaScript Input</Label>
                        <Textarea
                            id="input"
                            placeholder="// Paste your JS here"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="font-mono min-h-[200px]"
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <Button variant="outline" onClick={handleReset} disabled={!input}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                        <Button onClick={handleMinify} disabled={!input}>
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Minify JS
                        </Button>
                    </div>

                    {output && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Minified Output</Label>
                                <Button
                                    size="sm"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                    {copied ? 'Copied' : 'Copy Code'}
                                </Button>
                            </div>
                            <Textarea
                                value={output}
                                readOnly
                                className="font-mono bg-muted min-h-[150px]"
                            />
                            <div className="text-sm text-muted-foreground text-right">
                                Reduced by {input.length > 0 ? ((1 - output.length / input.length) * 100).toFixed(2) : 0}%
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
