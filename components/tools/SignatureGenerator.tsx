'use client'

import { useState, useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Download, Eraser, PenTool, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SignatureGenerator() {
    const padRef = useRef<any>(null)
    const [penColor, setPenColor] = useState('#000000')
    const [penWidth, setPenWidth] = useState([2])
    const [bgColor, setBgColor] = useState('transparent') // 'transparent' or '#ffffff'

    const clear = () => {
        padRef.current?.clear()
    }

    const download = (format: 'png' | 'jpg') => {
        if (padRef.current?.isEmpty()) {
            toast.error('Signature is empty')
            return
        }

        const dataURL = padRef.current.getTrimmedCanvas().toDataURL(format === 'png' ? 'image/png' : 'image/jpeg')
        const link = document.createElement('a')
        link.href = dataURL
        link.download = `signature.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Downloaded as ${format.toUpperCase()}`)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <PenTool className="h-5 w-5" />
                                Signature Pad
                            </CardTitle>
                            <CardDescription>Draw your signature below.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={clear}>
                                <Eraser className="h-4 w-4 mr-2" /> Clear
                            </Button>
                            <Button size="sm" onClick={() => download('png')}>
                                <Download className="h-4 w-4 mr-2" /> PNG (Transparent)
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => download('jpg')}>
                                <Download className="h-4 w-4 mr-2" /> JPG (White BG)
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Controls */}
                    <div className="flex flex-wrap gap-6 mb-4 items-center p-4 border rounded-lg bg-muted/20">
                        <div className="space-y-2 min-w-[150px]">
                            <label className="text-xs font-medium uppercase text-muted-foreground">Pen Color</label>
                            <div className="flex gap-2">
                                {['#000000', '#0000FF', '#FF0000', '#008000'].map(c => (
                                    <button
                                        key={c}
                                        className={`w-6 h-6 rounded-full border border-gray-300 ${penColor === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setPenColor(c)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 min-w-[200px]">
                            <label className="text-xs font-medium uppercase text-muted-foreground">Pen Width ({penWidth[0]}px)</label>
                            <Slider
                                value={penWidth}
                                onValueChange={setPenWidth}
                                max={10}
                                min={1}
                                step={0.5}
                            />
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="border-2 border-dashed rounded-xl overflow-hidden relative h-[400px] w-full bg-white dark:bg-white touch-none">
                        <SignatureCanvas
                            ref={padRef}
                            penColor={penColor}
                            minWidth={penWidth[0] * 0.5}
                            maxWidth={penWidth[0] * 1.5}
                            dotSize={penWidth[0]}
                            canvasProps={{
                                className: 'w-full h-full cursor-crosshair'
                            }}
                            backgroundColor={bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-300 pointer-events-none select-none font-bold">
                            UMTERS.CLUB
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Sign within the box above. Works on mobile & desktop.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
