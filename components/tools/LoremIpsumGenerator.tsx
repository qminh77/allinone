'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { AlignLeft, Copy, RefreshCw } from 'lucide-react'

const WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
    'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
    'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
    'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident',
    'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id',
    'est', 'laborum',
]

function wordAt(index: number) {
    return WORDS[index % WORDS.length]
}

function buildSentence(wordCount = 12, offset = 0) {
    const length = Math.max(4, wordCount)
    const words = Array.from({ length }, (_, index) => wordAt(offset + index))
    const sentence = words.join(' ')
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
}

function buildParagraph(sentenceCount = 4, offset = 0) {
    const count = Math.max(1, sentenceCount)
    return Array.from({ length: count }, (_, index) => buildSentence(12, offset + index * 12)).join(' ')
}

function generateText(units: 'paragraphs' | 'sentences' | 'words', count: number, offset = 0) {
    if (units === 'paragraphs') {
        return Array.from({ length: Math.max(1, count) }, (_, index) => buildParagraph(4, offset + index * 48)).join('\n\n')
    }

    if (units === 'sentences') {
        return Array.from({ length: Math.max(1, count) }, (_, index) => buildSentence(12, offset + index * 12)).join(' ')
    }

    return Array.from({ length: Math.max(1, count) }, (_, index) => wordAt(offset + index)).join(' ')
}

export function LoremIpsumGenerator() {
    const [count, setCount] = useState([5])
    const [units, setUnits] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs')
    const [seed, setSeed] = useState(0)
    const [output, setOutput] = useState(() => generateText('paragraphs', 5))

    const generate = () => {
        const nextSeed = seed + 17
        setSeed(nextSeed)
        setOutput(generateText(units, count[0], nextSeed))
    }

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
                        <Select value={units} onValueChange={(value) => setUnits(value as 'paragraphs' | 'sentences' | 'words')}>
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
