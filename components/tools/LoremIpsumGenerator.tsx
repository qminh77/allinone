'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoremIpsum } from 'lorem-ipsum'
import { toast } from 'sonner'
import { AlignLeft, Copy, RefreshCw } from 'lucide-react'

export function LoremIpsumGenerator() {
    const [count, setCount] = useState([5])
    const [units, setUnits] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs')
    const [output, setOutput] = useState('')

    const lorem = new LoremIpsum({
        sentencesPerParagraph: {
            max: 8,
            min: 4
        },
        wordsPerSentence: {
            max: 16,
            min: 4
        }
    })

    const generate = () => {
        let text = ''
        if (units === 'paragraphs') {
            text = lorem.generateParagraphs(count[0])
        } else if (units === 'sentences') {
            text = lorem.generateSentences(count[0])
        } else {
            text = lorem.generateWords(count[0])
        }
        setOutput(text)
    }

    // Generate on mount or init? Let's just user click generate usually better for these
    // or maybe initial gen.
    if (!output) generate()

    const copy = () => {
        navigator.clipboard.writeText(output)
        toast.success('Copied to clipboard')
    }

    return (
        <div className="grid gap-6 md:grid-cols-3 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Controls sidebar */}
            <Card className="md:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlignLeft className="h-5 w-5" />
                        Generator Settings
                    </CardTitle>
                    <CardDescription>Customize your dummy text.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={units} onValueChange={(v: any) => setUnits(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paragraphs">Paragraphs</SelectItem>
                                <SelectItem value="sentences">Sentences</SelectItem>
                                <SelectItem value="words">Words</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium">Quantity</label>
                            <span className="text-sm font-bold text-primary">{count[0]}</span>
                        </div>
                        <Slider
                            value={count}
                            onValueChange={setCount}
                            min={1}
                            max={100}
                            step={1}
                        />
                    </div>

                    <Button className="w-full" onClick={generate}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate Lorem Ipsum
                    </Button>
                </CardContent>
            </Card>

            {/* Output area */}
            <Card className="md:col-span-2 flex flex-col h-full">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Generated Text</CardTitle>
                        <Button variant="secondary" size="sm" onClick={copy}>
                            <Copy className="h-4 w-4 mr-2" /> Copy
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col">
                    <Textarea
                        readOnly
                        value={output}
                        className="flex-1 resize-none p-6 text-base leading-relaxed overflow-auto"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
