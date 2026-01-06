'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Copy, Check, FileType, Code } from 'lucide-react'
import { marked } from 'marked'

export function MarkdownConverter() {
    const [markdown, setMarkdown] = useState('# Hello World\n\nThis is **Markdown** content.\n\n- Item 1\n- Item 2')
    const [html, setHtml] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        // Parse markdown to HTML
        try {
            const parsed = marked.parse(markdown) as string
            setHtml(parsed)
        } catch (e) {
            setHtml('Error parsing markdown')
        }
    }, [markdown])

    const copyToClipboard = () => {
        if (!html) return
        navigator.clipboard.writeText(html)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2 h-[600px]">
            {/* Input Column */}
            <Card className="flex flex-col h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileType className="h-4 w-4" />
                        Markdown Input
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col gap-2">
                    <Textarea
                        className="flex-1 font-mono resize-none p-4"
                        placeholder="Type your markdown here..."
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                    />
                </CardContent>
            </Card>

            {/* Output Column */}
            <Card className="flex flex-col h-full bg-muted/30">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        HTML Preview
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        disabled={!html}
                        className="h-8 px-2"
                    >
                        {copied ? <Check className="h-4 w-4 text-green-500 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copied ? 'Copied' : 'Copy HTML'}
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-md border bg-background h-full">
                        <div dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
