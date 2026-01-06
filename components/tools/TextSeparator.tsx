'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowRight, Copy, List, SeparatorHorizontal, Trash2 } from 'lucide-react'

export function TextSeparator() {
    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')
    const [separator, setSeparator] = useState('newline')
    const [joiner, setJoiner] = useState('comma')
    const [customSeparator, setCustomSeparator] = useState('')
    const [customJoiner, setCustomJoiner] = useState('')

    const handleProcess = () => {
        if (!input) return

        let sepChar = '\n'
        if (separator === 'comma') sepChar = ','
        else if (separator === 'pipe') sepChar = '|'
        else if (separator === 'space') sepChar = ' '
        else if (separator === 'custom') sepChar = customSeparator

        let joinChar = ','
        if (joiner === 'newline') joinChar = '\n'
        else if (joiner === 'pipe') joinChar = '|'
        else if (joiner === 'space') joinChar = ' '
        else if (joiner === 'custom') joinChar = customJoiner

        // Split ignoring empty
        const items = input.split(sepChar).map(i => i.trim()).filter(i => i)
        setOutput(items.join(joinChar))
        toast.success('Processed ' + items.length + ' items')
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(output)
        toast.success('Copied to clipboard')
    }

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Controls */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex flex-col gap-2 w-40">
                            <label className="text-sm font-medium">Split By (Input)</label>
                            <Select value={separator} onValueChange={setSeparator}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newline">New Line (\n)</SelectItem>
                                    <SelectItem value="comma">Comma (,)</SelectItem>
                                    <SelectItem value="pipe">Pipe (|)</SelectItem>
                                    <SelectItem value="space">Space</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {separator === 'custom' && (
                            <div className="flex flex-col gap-2 w-24">
                                <label className="text-sm font-medium">Custom Sep</label>
                                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={customSeparator} onChange={e => setCustomSeparator(e.target.value)} />
                            </div>
                        )}

                        <ArrowRight className="h-6 w-6 mb-2 text-muted-foreground hidden md:block" />

                        <div className="flex flex-col gap-2 w-40">
                            <label className="text-sm font-medium">Join By (Output)</label>
                            <Select value={joiner} onValueChange={setJoiner}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="comma">Comma (,)</SelectItem>
                                    <SelectItem value="newline">New Line (\n)</SelectItem>
                                    <SelectItem value="pipe">Pipe (|)</SelectItem>
                                    <SelectItem value="space">Space</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {joiner === 'custom' && (
                            <div className="flex flex-col gap-2 w-24">
                                <label className="text-sm font-medium">Custom Join</label>
                                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={customJoiner} onChange={e => setCustomJoiner(e.target.value)} />
                            </div>
                        )}

                        <Button onClick={handleProcess} className="mb-0 ml-auto md:ml-0">
                            Process
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 flex-1 min-h-0">
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            Input
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
                        <Textarea
                            placeholder="Item 1&#10;Item 2&#10;Item 3"
                            className="flex-1 resize-none p-4"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}>
                            <Trash2 className="h-4 w-4 mr-2" /> Clear
                        </Button>
                    </CardContent>
                </Card>

                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <SeparatorHorizontal className="h-4 w-4" />
                            Output
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
                        <Textarea
                            readOnly
                            placeholder="Item 1,Item 2,Item 3"
                            className="flex-1 resize-none p-4 bg-muted/30"
                            value={output}
                        />
                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={handleCopy} disabled={!output}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
