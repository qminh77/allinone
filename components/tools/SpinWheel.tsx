'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Disc, Play, RefreshCw, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORS = [
    '#EF4444', // red-500
    '#F97316', // orange-500
    '#EAB308', // yellow-500
    '#22C55E', // green-500
    '#06B6D4', // cyan-500
    '#3B82F6', // blue-500
    '#A855F7', // purple-500
    '#EC4899', // pink-500
]

export function SpinWheel() {
    const [input, setInput] = useState('Apple\nBanana\nOrange\nMango\nGrape\nStrawberry')
    const [items, setItems] = useState<string[]>([])
    const [isSpinning, setIsSpinning] = useState(false)
    const [rotation, setRotation] = useState(0)
    const [winner, setWinner] = useState<string | null>(null)
    const wheelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        setItems(lines)
    }, [input])

    const handleSpin = () => {
        if (isSpinning || items.length === 0) return

        setIsSpinning(true)
        setWinner(null)

        // Random rotation between 360 * 5 (5 spins) and 360 * 10 (10 spins) + random offset
        const minSpins = 5
        const maxSpins = 10
        const randomDegree = Math.floor(Math.random() * 360)
        const totalRotation = rotation + (360 * minSpins) + (Math.floor(Math.random() * (360 * (maxSpins - minSpins))) + randomDegree)

        // Ensure we land on a segment clearly (optional, but good for precise UI)
        // The wheel spins clockwise. The pointer is usually at 0 (top) or 90 (right).
        // Let's assume pointer is at the right (0 degrees in standard SVG arc math if we don't rotate SVG, but CSS rotate starts from top if 0? No, 0 is usually top in CSS transform).
        // Let's rely on standard CSS transform coordinate system: 0deg is pointing UP.
        // If pointer is at the TOP (Arrow pointing down).

        setRotation(totalRotation)

        setTimeout(() => {
            setIsSpinning(false)
            calculateWinner(totalRotation)
        }, 5000) // Match CSS transition duration
    }

    const calculateWinner = (finalRotation: number) => {
        const normalizedRotation = finalRotation % 360
        // If pointer is at TOP (0 degrees).
        // The wheel rotates Clockwise.
        // Examples:
        // 0 deg -> Item 0 (if Item 0 starts at top)
        // 90 deg -> Item at 270 deg (since stick is at top and wheel moved 90 CW)
        // So the segment at the top is (360 - normalizedRotation) % 360?
        // Let's consider:
        // Segment 0 starts at 0 deg, ends at (360/N) deg.
        // If we rotate 10 deg CW, Segment 0 moves to 10 deg.
        // The pointer is at 0 (static).
        // So we are looking for the segment that COVERS 0 deg (or 360 deg) AFTER rotation.
        // Effectively, we need to check which segment interval contains (360 - normalizedRotation) % 360.

        const degreesPerItem = 360 / items.length
        const pointerAngle = (360 - normalizedRotation) % 360

        // Find index
        const index = Math.floor(pointerAngle / degreesPerItem)
        setWinner(items[index])
    }

    // Generate SVG paths
    const getWheelSegments = () => {
        const total = items.length
        if (total === 0) return null

        const center = 200
        const radius = 190 // leave some margin
        const degreesPerItem = 360 / total

        return items.map((item, index) => {
            const startAngle = index * degreesPerItem
            const endAngle = (index + 1) * degreesPerItem

            // Convert polar to cartesian
            // SVG uses 0 degrees at 3 o'clock usually, but let's do standard math
            // angle in radians
            // We want 0 degrees to be at 12 o'clock for consistency with CSS rotate?
            // Actually, if we use standard sin/cos:
            // x = cx + r * cos(a)
            // y = cy + r * sin(a)
            // 0 radians is 3 o'clock.
            // -PI/2 is 12 o'clock.

            const startRad = (startAngle - 90) * (Math.PI / 180)
            const endRad = (endAngle - 90) * (Math.PI / 180)

            const x1 = center + radius * Math.cos(startRad)
            const y1 = center + radius * Math.sin(startRad)
            const x2 = center + radius * Math.cos(endRad)
            const y2 = center + radius * Math.sin(endRad)

            // Large arc flag
            const largeArcFlag = degreesPerItem > 180 ? 1 : 0

            // Path command
            // M center,center L x1,y1 A radius,radius 0 largeArcFlag,1 x2,y2 Z
            const d = `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`

            return (
                <g key={index}>
                    <path
                        d={d}
                        fill={COLORS[index % COLORS.length]}
                        stroke="white"
                        strokeWidth="2"
                    />
                    <text
                        x={center + (radius * 0.65) * Math.cos((startRad + endRad) / 2)}
                        y={center + (radius * 0.65) * Math.sin((startRad + endRad) / 2)}
                        fill="white"
                        className="text-[12px] font-bold pointer-events-none select-none"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${(startAngle + endAngle) / 2}, ${center + (radius * 0.65) * Math.cos((startRad + endRad) / 2)}, ${center + (radius * 0.65) * Math.sin((startRad + endRad) / 2)})`}
                        style={{
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                        }}
                    >
                        {item.length > 15 ? item.substring(0, 15) + '...' : item}
                    </text>
                </g>
            )
        })
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Input Items</CardTitle>
                        <CardDescription>
                            Enter each prize or option on a new line.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="input">Entries ({items.length})</Label>
                            <Textarea
                                id="input"
                                placeholder="Enter items..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="font-mono h-[300px] resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => {
                                    setInput('')
                                    setWinner(null)
                                    setRotation(0)
                                }}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <Card className="flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Disc className="h-6 w-6" /> Spin the Wheel
                        </CardTitle>
                        {winner && (
                            <div className="animate-in fade-in zoom-in duration-500 mt-4">
                                <div className="text-xl font-bold text-primary flex items-center justify-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                    Winner: <span className="text-foreground">{winner}</span>
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-8 w-full">
                        <div className="relative">
                            {/* Pointer */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-10">
                                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-t-[30px] border-t-foreground border-r-[15px] border-r-transparent drop-shadow-md"></div>
                            </div>

                            {/* Wheel */}
                            <div
                                className="relative w-[400px] h-[400px] transition-[transform] ease-out"
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    transitionDuration: '5s'
                                }}
                            >
                                <svg
                                    viewBox="0 0 400 400"
                                    className="w-full h-full drop-shadow-xl"
                                >
                                    <circle cx="200" cy="200" r="195" fill="white" stroke="#e2e8f0" strokeWidth="10" />
                                    {getWheelSegments()}
                                    <circle cx="200" cy="200" r="10" fill="white" stroke="#e2e8f0" strokeWidth="2" />
                                </svg>
                            </div>

                            {/* Center Button (Spin) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                <Button
                                    size="lg"
                                    className="rounded-full w-20 h-20 shadow-2xl border-4 border-background text-lg font-bold"
                                    onClick={handleSpin}
                                    disabled={isSpinning || items.length < 2}
                                >
                                    {isSpinning ? '...' : 'SPIN'}
                                </Button>
                            </div>
                        </div>

                        <div className="mt-8 text-sm text-muted-foreground">
                            {items.length < 2 ? 'Add at least 2 items to spin' : 'Click SPIN to start'}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
