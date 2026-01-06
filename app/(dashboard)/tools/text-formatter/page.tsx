/**
 * Text Formatter Tool
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function TextFormatterPage() {
    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')

    const formats = [
        { name: 'UPPERCASE', fn: (text: string) => text.toUpperCase() },
        { name: 'lowercase', fn: (text: string) => text.toLowerCase() },
        { name: 'Capitalize', fn: (text: string) => text.replace(/\b\w/g, l => l.toUpperCase()) },
        { name: 'Reverse', fn: (text: string) => text.split('').reverse().join('') },
    ]

    const handleFormat = (formatFn: (text: string) => string) => {
        setOutput(formatFn(input))
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">📝 Text Formatter</h1>
                <p className="text-muted-foreground">
                    Công cụ định dạng văn bản đa dạng
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Input</CardTitle>
                        <CardDescription>Nhập text cần định dạng</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Nhập text ở đây..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="min-h-[200px]"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Output</CardTitle>
                        <CardDescription>Kết quả sau khi định dạng</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={output}
                            readOnly
                            className="min-h-[200px] bg-muted"
                        />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Định dạng</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {formats.map((format) => (
                        <Button
                            key={format.name}
                            onClick={() => handleFormat(format.fn)}
                            variant="outline"
                        >
                            {format.name}
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
