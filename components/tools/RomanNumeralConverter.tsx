'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Type } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

export function RomanNumeralConverter() {
    const [number, setNumber] = useState('')
    const [roman, setRoman] = useState('')

    // Logic
    const toRoman = (num: number): string => {
        if (num < 1 || num > 3999) return 'Out of range (1-3999)'
        const map: [number, string][] = [
            [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
            [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
            [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
        ]
        let result = ''
        for (const [val, char] of map) {
            while (num >= val) {
                result += char
                num -= val
            }
        }
        return result
    }

    const fromRoman = (str: string): number | string => {
        const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
        let result = 0
        const roman = str.toUpperCase()

        // Validation regex
        if (!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(roman)) {
            return 'Invalid Roman Numeral'
        }

        for (let i = 0; i < roman.length; i++) {
            const current = map[roman[i]]
            const next = map[roman[i + 1]]
            if (next && current < next) {
                result -= current
            } else {
                result += current
            }
        }
        return result || 0
    }

    const handleNumberChange = (val: string) => {
        setNumber(val)
        if (!val) {
            setRoman('')
            return
        }
        const n = parseInt(val)
        if (isNaN(n)) return
        setRoman(toRoman(n))
    }

    const handleRomanChange = (val: string) => {
        setRoman(val.toUpperCase())
        if (!val) {
            setNumber('')
            return
        }
        const res = fromRoman(val)
        setNumber(res.toString())
    }

    const copy = (txt: string) => {
        navigator.clipboard.writeText(txt)
        toast.success('Copied')
    }

    return (
        <div className="max-w-xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Roman Numeral Converter
                    </CardTitle>
                    <CardDescription>Convert numbers (1-3999) to Roman numerals and back.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Decimal Number</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="2024"
                                value={number}
                                onChange={e => handleNumberChange(e.target.value)}
                                className="font-mono text-lg"
                                type="number"
                            />
                            <Button variant="outline" size="icon" onClick={() => copy(number)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Roman Numeral</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="MMXXIV"
                                value={roman}
                                onChange={e => handleRomanChange(e.target.value)}
                                className="font-mono text-lg uppercase"
                            />
                            <Button variant="outline" size="icon" onClick={() => copy(roman)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
