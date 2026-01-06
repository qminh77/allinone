'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Thermometer } from 'lucide-react'

export function TemperatureConverter() {
    const [celsius, setCelsius] = useState('')
    const [fahrenheit, setFahrenheit] = useState('')
    const [kelvin, setKelvin] = useState('')

    const handleCelsiusChange = (val: string) => {
        setCelsius(val)
        if (val === '' || isNaN(Number(val))) {
            setFahrenheit('')
            setKelvin('')
            return
        }
        const c = parseFloat(val)
        setFahrenheit(((c * 9 / 5) + 32).toFixed(2).replace(/\.00$/, ''))
        setKelvin((c + 273.15).toFixed(2).replace(/\.00$/, ''))
    }

    const handleFahrenheitChange = (val: string) => {
        setFahrenheit(val)
        if (val === '' || isNaN(Number(val))) {
            setCelsius('')
            setKelvin('')
            return
        }
        const f = parseFloat(val)
        const c = (f - 32) * 5 / 9
        setCelsius(c.toFixed(2).replace(/\.00$/, ''))
        setKelvin((c + 273.15).toFixed(2).replace(/\.00$/, ''))
    }

    const handleKelvinChange = (val: string) => {
        setKelvin(val)
        if (val === '' || isNaN(Number(val))) {
            setCelsius('')
            setFahrenheit('')
            return
        }
        const k = parseFloat(val)
        const c = k - 273.15
        setCelsius(c.toFixed(2).replace(/\.00$/, ''))
        setFahrenheit(((c * 9 / 5) + 32).toFixed(2).replace(/\.00$/, ''))
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Thermometer className="h-5 w-5 text-red-500" />
                        Celsius (°C)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        type="number"
                        placeholder="0"
                        value={celsius}
                        onChange={(e) => handleCelsiusChange(e.target.value)}
                        className="text-2xl font-mono"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Thermometer className="h-5 w-5 text-blue-500" />
                        Fahrenheit (°F)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        type="number"
                        placeholder="32"
                        value={fahrenheit}
                        onChange={(e) => handleFahrenheitChange(e.target.value)}
                        className="text-2xl font-mono"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Thermometer className="h-5 w-5 text-orange-500" />
                        Kelvin (K)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        type="number"
                        placeholder="273.15"
                        value={kelvin}
                        onChange={(e) => handleKelvinChange(e.target.value)}
                        className="text-2xl font-mono"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
