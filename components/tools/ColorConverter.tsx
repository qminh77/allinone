'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Copy, RefreshCw, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { colord, extend } from 'colord'
import cmykPlugin from 'colord/plugins/cmyk'
import namesPlugin from 'colord/plugins/names'

// Extend colord with plugins
extend([cmykPlugin, namesPlugin])

export function ColorConverter() {
    const [input, setInput] = useState('#3b82f6') // Default Blue-500
    const [color, setColor] = useState(colord('#3b82f6'))

    // Update color object when input changes, if valid
    const handleInputChange = (val: string) => {
        setInput(val)
        const c = colord(val)
        if (c.isValid()) {
            setColor(c)
        }
    }

    const formats = useMemo(() => {
        if (!color.isValid()) return null

        return [
            { label: 'HEX', value: color.toHex() },
            { label: 'RGB', value: color.toRgbString() },
            { label: 'HSL', value: color.toHslString() },
            { label: 'CMYK', value: color.toCmykString() },
            { label: 'Name', value: color.toName({ closest: true }) || 'Unknown' },
        ]
    }, [color])

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`Copied ${label}`)
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Color Picker</CardTitle>
                    <CardDescription>Chọn màu hoặc nhập mã màu bất kỳ (Hex, RGB, Name).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Visual Preview & Picker */}
                    <div
                        className="w-full h-32 rounded-lg border shadow-inner flex items-center justify-center relative overflow-hidden group"
                        style={{ backgroundColor: color.isValid() ? color.toHex() : '#ffffff' }}
                    >
                        <input
                            type="color"
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            value={color.isValid() ? color.toHex() : '#000000'}
                            onChange={(e) => handleInputChange(e.target.value)}
                        />
                        <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to Pick
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="color-input">Input Color Code</Label>
                        <div className="flex gap-2">
                            <Input
                                id="color-input"
                                value={input}
                                onChange={(e) => handleInputChange(e.target.value)}
                                placeholder="#000000, rgb(0,0,0), blue..."
                                className="font-mono"
                            />
                        </div>
                    </div>

                    {/* Basic Shades/Tints Visualization (Optional but cool) */}
                    {color.isValid() && (
                        <div className="flex h-8 rounded-md overflow-hidden">
                            {[0.2, 0.4, 0.6, 0.8].map(opacity => (
                                <div key={opacity} className="flex-1" style={{ backgroundColor: color.alpha(opacity).toRgbString() }} />
                            ))}
                            <div className="flex-1" style={{ backgroundColor: color.toHex() }} />
                            {[0.8, 0.6, 0.4, 0.2].map(darken => (
                                <div key={darken} className="flex-1" style={{ backgroundColor: color.darken(0.2 * (5 - darken * 5)).toHex() }} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Converted Formats
                    </CardTitle>
                    <CardDescription>Kết quả chuyển đổi sang các định dạng khác.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {formats ? formats.map((fmt) => (
                        <div key={fmt.label} className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors border">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase">{fmt.label}</label>
                                <p className="font-mono font-medium text-sm">{fmt.value}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(fmt.value, fmt.label)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    )) : (
                        <div className="flex items-center justify-center h-40 text-muted-foreground italic">
                            Invalid color
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
