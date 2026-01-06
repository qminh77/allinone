'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HardDrive, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const units = [
    { value: 'bit', label: 'Bits (b)', ratio: 1 },
    { value: 'nibble', label: 'Nibbles', ratio: 4 },
    { value: 'byte', label: 'Bytes (B)', ratio: 8 },

    // Decimal (SI)
    { value: 'kb', label: 'Kilobits (Kb)', ratio: 1000 },
    { value: 'kb_byte', label: 'Kilobytes (KB)', ratio: 8000 },
    { value: 'mb', label: 'Megabits (Mb)', ratio: 1000 * 1000 },
    { value: 'mb_byte', label: 'Megabytes (MB)', ratio: 8000 * 1000 },
    { value: 'gb', label: 'Gigabits (Gb)', ratio: 1000 * 1000 * 1000 },
    { value: 'gb_byte', label: 'Gigabytes (GB)', ratio: 8000 * 1000 * 1000 },
    { value: 'tb', label: 'Terabits (Tb)', ratio: 1000 * 1000 * 1000 * 1000 },
    { value: 'tb_byte', label: 'Terabytes (TB)', ratio: 8000 * 1000 * 1000 * 1000 },

    // Binary (IEC)
    { value: 'kib', label: 'Kibibits (Kib)', ratio: 1024 },
    { value: 'kib_byte', label: 'Kibibytes (KiB)', ratio: 8192 },
    { value: 'mib', label: 'Mebibits (Mib)', ratio: 1024 * 1024 },
    { value: 'mib_byte', label: 'Mebibytes (MiB)', ratio: 8192 * 1024 },
    { value: 'gib', label: 'Gibibits (Gib)', ratio: 1024 * 1024 * 1024 },
    { value: 'gib_byte', label: 'Gibibytes (GiB)', ratio: 8192 * 1024 * 1024 },
    { value: 'tib', label: 'Tebibits (Tib)', ratio: 1024 * 1024 * 1024 * 1024 },
    { value: 'tib_byte', label: 'Tebibytes (TiB)', ratio: 8192 * 1024 * 1024 * 1024 },
]

export function DataConverter() {
    const [inputValue, setInputValue] = useState('')
    const [inputUnit, setInputUnit] = useState('byte')
    const [bitValue, setBitValue] = useState(0)

    useEffect(() => {
        const val = parseFloat(inputValue)
        if (isNaN(val)) {
            setBitValue(0)
            return
        }
        const unit = units.find(u => u.value === inputUnit)
        if (unit) {
            setBitValue(val * unit.ratio)
        }
    }, [inputValue, inputUnit])

    const format = (bits: number, targetUnitValue: string) => {
        if (!inputValue) return '-'
        const unit = units.find(u => u.value === targetUnitValue)
        if (!unit) return '-'
        const val = bits / unit.ratio

        // Dynamic styling for decimals
        if (val === 0) return '0'

        // Avoid super long decimals but keep precision for small numbers
        let formatted = val.toLocaleString('en-US', { maximumFractionDigits: 10 })
        if (formatted.length > 20) {
            formatted = val.toExponential(4)
        }
        return formatted
    }

    const copy = (txt: string) => {
        if (txt === '-') return
        navigator.clipboard.writeText(txt.replace(/,/g, ''))
        toast.success('Copied value')
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Source Value
                    </CardTitle>
                    <CardDescription>Enter the value you want to convert.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                type="number"
                                placeholder="1024"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                className="text-xl font-mono"
                            />
                        </div>
                        <Select value={inputUnit} onValueChange={setInputUnit}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {units.map(u => (
                                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {units.map(u => (
                    <Card key={u.value} className={u.value === inputUnit ? 'border-primary bg-primary/5' : ''}>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-muted-foreground">{u.label}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copy(format(bitValue, u.value))}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                            <div className="font-mono text-lg break-all">
                                {format(bitValue, u.value)}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
