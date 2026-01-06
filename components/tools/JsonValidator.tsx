'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Copy, Trash2, FileJson, Check, X, Minimize2, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function JsonValidator() {
    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [indent, setIndent] = useState('2') // '2', '4', 'tab', 'minified'

    const validateAndFormat = (currentInput: string = input, currentIndent: string = indent) => {
        if (!currentInput.trim()) {
            setOutput('')
            setError(null)
            return
        }

        try {
            const parsed = JSON.parse(currentInput)
            setError(null)

            if (currentIndent === 'minified') {
                setOutput(JSON.stringify(parsed))
            } else if (currentIndent === 'tab') {
                setOutput(JSON.stringify(parsed, null, '\t'))
            } else {
                setOutput(JSON.stringify(parsed, null, Number(currentIndent)))
            }
        } catch (err: any) {
            setError(err.message)
            // Keep the output generally empty or maybe previous valid output? 
            // Let's clear output to indicate invalid state clearly in the output box, 
            // but the input remains for them to fix.
            // setOutput('') 
        }
    }

    const handleInputChange = (val: string) => {
        setInput(val)
        // Auto-validate on change or wait for button? 
        // Real-time validation is better UX, but formatting might strict typing.
        // Let's just validate syntax on change if we want, but let's strictly format on demand/indent change
        // to avoid jumping cursor.
        // For now, just clear error if it becomes empty.
        if (!val.trim()) setError(null)
    }

    const handleFormat = () => {
        validateAndFormat(input, indent)
        if (!input.trim()) return

        try {
            JSON.parse(input)
            toast.success('JSON Valid & Formatted')
        } catch (e) {
            toast.error('Invalid JSON')
        }
    }

    const handleIndentChange = (val: string) => {
        setIndent(val)
        // If we already have input, re-format immediately
        if (input.trim()) {
            validateAndFormat(input, val)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(output)
        toast.success('Copied formatted JSON')
    }

    const handleClear = () => {
        setInput('')
        setOutput('')
        setError(null)
    }

    // Load sample
    const loadSample = () => {
        const sample = {
            "project": "UMTERS.CLUB",
            "active": true,
            "modules": ["json-validator", "slug-generator"],
            "meta": {
                "version": 1.0,
                "author": "Admin"
            }
        }
        const str = JSON.stringify(sample)
        setInput(str)
        validateAndFormat(str, indent)
    }

    return (
        <div className="space-y-6 h-[calc(100vh-200px)] min-h-[600px] flex flex-col">
            <div className="grid gap-6 md:grid-cols-2 flex-1">
                {/* Input Section */}
                <Card className="flex flex-col h-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Input JSON</CardTitle>
                        <CardDescription>Paste your JSON here.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
                        <div className="flex justify-between items-center gap-2">
                            <Button variant="outline" size="sm" onClick={loadSample} className="text-xs">
                                Load Sample
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleClear} disabled={!input}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        </div>
                        <Textarea
                            placeholder='{"key": "value"}'
                            className="flex-1 font-mono text-sm resize-none p-4"
                            value={input}
                            onChange={(e) => handleInputChange(e.target.value)}
                        />
                        {error && (
                            <Alert variant="destructive" className="mt-auto shrink-0">
                                <X className="h-4 w-4" />
                                <AlertTitle>Invalid JSON</AlertTitle>
                                <AlertDescription className="font-mono text-xs mt-1">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}
                        {!error && input.trim() && (
                            <Alert className="mt-auto shrink-0 border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400">
                                <Check className="h-4 w-4" />
                                <AlertTitle>Valid JSON</AlertTitle>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Output Section */}
                <Card className="flex flex-col h-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Formatted Output</CardTitle>
                                <CardDescription>Result of validation and formatting.</CardDescription>
                            </div>
                            <Select value={indent} onValueChange={handleIndentChange}>
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2">2 Spaces</SelectItem>
                                    <SelectItem value="4">4 Spaces</SelectItem>
                                    <SelectItem value="tab">Tabs</SelectItem>
                                    <SelectItem value="minified">Minified (Compact)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
                        <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={handleFormat}>
                                <FileJson className="h-4 w-4 mr-2" />
                                Process / Format
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handleCopy} disabled={!output}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                            </Button>
                        </div>
                        <Textarea
                            readOnly
                            placeholder="Formatted JSON will appear here..."
                            className="flex-1 font-mono text-sm resize-none p-4 bg-muted/30"
                            value={output}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
