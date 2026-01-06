'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'sql-formatter'
import { toast } from 'sonner'
import { Copy, Database, Trash2, Code } from 'lucide-react'

export function SqlFormatter() {
    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')
    const [language, setLanguage] = useState('sql')
    const [error, setError] = useState<string | null>(null)

    const handleFormat = () => {
        if (!input.trim()) return

        try {
            const formatted = format(input, {
                language: language as any,
                tabWidth: 2,
                keywordCase: 'upper',
            })
            setOutput(formatted)
            setError(null)
            toast.success('SQL Formatted')
        } catch (e: any) {
            setError(e.message)
            toast.error('Formatting Failed')
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(output)
        toast.success('Copied to clipboard')
    }

    const handleClear = () => {
        setInput('')
        setOutput('')
        setError(null)
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 h-[calc(100vh-200px)] min-h-[600px]">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Input SQL
                    </CardTitle>
                    <CardDescription>
                        Paste your raw SQL query here.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
                    <div className="flex gap-2">
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Dialect" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sql">Standard SQL</SelectItem>
                                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                <SelectItem value="mysql">MySQL</SelectItem>
                                <SelectItem value="tsql">T-SQL (SQL Server)</SelectItem>
                                <SelectItem value="plsql">PL/SQL (Oracle)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={handleClear} title="Clear">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <Textarea
                        placeholder="SELECT * FROM users WHERE id = 1"
                        className="flex-1 font-mono resize-none p-4 text-sm"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900">
                            {error}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Formatted SQL
                    </CardTitle>
                    <CardDescription>
                        Clean, indented result.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
                    <div className="flex justify-end gap-2">
                        <Button onClick={handleFormat}>Format SQL</Button>
                        <Button variant="secondary" onClick={handleCopy} disabled={!output}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                        </Button>
                    </div>
                    <Textarea
                        readOnly
                        placeholder="Formatted output..."
                        className="flex-1 font-mono resize-none p-4 text-sm bg-muted/30"
                        value={output}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
