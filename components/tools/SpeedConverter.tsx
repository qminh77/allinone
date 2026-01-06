'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Gauge } from 'lucide-react'

export function SpeedConverter() {
    const [kph, setKph] = useState('')
    const [mph, setMph] = useState('')

    const handleKphChange = (val: string) => {
        setKph(val)
        if (val === '' || isNaN(Number(val))) {
            setMph('')
            return
        }
        const k = parseFloat(val)
        // 1 km = 0.621371 miles
        setMph((k * 0.621371).toFixed(2).replace(/\.00$/, ''))
    }

    const handleMphChange = (val: string) => {
        setMph(val)
        if (val === '' || isNaN(Number(val))) {
            setKph('')
            return
        }
        const m = parseFloat(val)
        // 1 mile = 1.60934 km
        setKph((m * 1.60934).toFixed(2).replace(/\.00$/, ''))
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Gauge className="h-5 w-5 text-indigo-500" />
                        Kilometers/Hour (KPH)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        type="number"
                        placeholder="100"
                        value={kph}
                        onChange={(e) => handleKphChange(e.target.value)}
                        className="text-2xl font-mono"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Gauge className="h-5 w-5 text-pink-500" />
                        Miles/Hour (MPH)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        type="number"
                        placeholder="62.14"
                        value={mph}
                        onChange={(e) => handleMphChange(e.target.value)}
                        className="text-2xl font-mono"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
