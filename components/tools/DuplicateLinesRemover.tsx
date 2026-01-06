'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Copy, Trash2, ArrowRight, ListFilter } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function DuplicateLinesRemover() {
    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')
    const [stats, setStats] = useState({ original: 0, result: 0, removed: 0 })

    // Options
    const [caseSensitive, setCaseSensitive] = useState(false)
    const [trimWhitespace, setTrimWhitespace] = useState(true)
    const [removeEmpty, setRemoveEmpty] = useState(true)

    const processLines = () => {
        if (!input) return

        let lines = input.split(/\r\n|\r|\n/)
        const originalCount = lines.length

        // Pre-processing
        if (trimWhitespace) {
            lines = lines.map(line => line.trim())
        }
        if (removeEmpty) {
            lines = lines.filter(line => line.length > 0)
        }

        // De-duplication using Set
        // If not case sensitive, we need a way to track unique keys but keep original casing
        let uniqueLines: string[] = []

        if (caseSensitive) {
            uniqueLines = Array.from(new Set(lines))
        } else {
            const seen = new Set<string>()
            uniqueLines = lines.filter(line => {
                const key = line.toLowerCase()
                if (seen.has(key)) return false
                seen.add(key)
                return true
            })
        }

        setOutput(uniqueLines.join('\n'))
        setStats({
            original: originalCount,
            result: uniqueLines.length,
            removed: originalCount - uniqueLines.length
            // Note: removed count here is simple diff. 
            // If we filter empty lines, "removed" includes those empty lines too.
        })
        toast.success('Processed successfully!')
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(output)
        toast.success('Copied result to clipboard')
    }

    const handleClear = () => {
        setInput('')
        setOutput('')
        setStats({ original: 0, result: 0, removed: 0 })
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Settings</CardTitle>
                        <CardDescription>Configure how duplicates are detected.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="case-sensitive">Case Sensitive</Label>
                            <Switch id="case-sensitive" checked={caseSensitive} onCheckedChange={setCaseSensitive} />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="trim-whitespace">Trim Whitespace</Label>
                            <Switch id="trim-whitespace" checked={trimWhitespace} onCheckedChange={setTrimWhitespace} />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="remove-empty">Remove Empty Lines</Label>
                            <Switch id="remove-empty" checked={removeEmpty} onCheckedChange={setRemoveEmpty} />
                        </div>

                        <Button className="w-full" onClick={processLines} disabled={!input}>
                            <ListFilter className="h-4 w-4 mr-2" />
                            Remove Duplicates
                        </Button>
                    </CardContent>
                </Card>

                {output && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Original Lines:</span>
                                <span className="font-medium">{stats.original}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Unique Lines:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">{stats.result}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-muted-foreground">Removed:</span>
                                <span className="font-bold text-red-500">{stats.removed}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="lg:col-span-2 space-y-6">
                <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle>Input vs Output</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleClear} disabled={!input}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                                <Button size="sm" onClick={handleCopy} disabled={!output}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Result
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 grid gap-4 md:grid-cols-2 min-h-[400px]">
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Original List</Label>
                            <Textarea
                                placeholder="Paste your list here..."
                                className="flex-1 font-mono text-sm resize-none p-4"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2 relative">
                            <div className="absolute top-1/2 -left-6 hidden md:block z-10">
                                <div className="bg-background border rounded-full p-1 shadow-sm">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Unique List</Label>
                            <Textarea
                                readOnly
                                placeholder="Result will appear here..."
                                className="flex-1 font-mono text-sm resize-none p-4 bg-muted/30"
                                value={output}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
