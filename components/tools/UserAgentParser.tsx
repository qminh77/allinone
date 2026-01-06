'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RotateCcw, MonitorSmartphone } from 'lucide-react'
import { UAParser } from 'ua-parser-js'

export function UserAgentParser() {
    const [userAgent, setUserAgent] = useState('')
    const [parsed, setParsed] = useState<UAParser.IResult | null>(null)

    useEffect(() => {
        // Auto-fill with current UA
        const currentUA = navigator.userAgent
        setUserAgent(currentUA)
        parseUA(currentUA)
    }, [])

    const parseUA = (ua: string) => {
        const parser = new UAParser(ua)
        setParsed(parser.getResult())
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setUserAgent(val)
        parseUA(val)
    }

    const handleReset = () => {
        const currentUA = navigator.userAgent
        setUserAgent(currentUA)
        parseUA(currentUA)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>User Agent Parser</CardTitle>
                    <CardDescription>
                        Phân tích thông tin chi tiết từ chuỗi User Agent.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="input">User Agent String</Label>
                        <Textarea
                            id="input"
                            value={userAgent}
                            onChange={handleInputChange}
                            className="font-mono min-h-[100px]"
                            placeholder="Mozilla/5.0..."
                        />
                        <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={handleReset}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset to My UA
                            </Button>
                        </div>
                    </div>

                    {parsed && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Browser */}
                            <InfoCard
                                title="Browser"
                                items={[
                                    { label: 'Name', value: parsed.browser.name },
                                    { label: 'Version', value: parsed.browser.version },
                                    { label: 'Major', value: parsed.browser.major }
                                ]}
                            />

                            {/* OS */}
                            <InfoCard
                                title="Operating System"
                                items={[
                                    { label: 'Name', value: parsed.os.name },
                                    { label: 'Version', value: parsed.os.version }
                                ]}
                            />

                            {/* Device */}
                            <InfoCard
                                title="Device"
                                items={[
                                    { label: 'Type', value: parsed.device.type || 'Desktop' },
                                    { label: 'Vendor', value: parsed.device.vendor },
                                    { label: 'Model', value: parsed.device.model }
                                ]}
                            />

                            {/* CPU */}
                            <InfoCard
                                title="CPU"
                                items={[
                                    { label: 'Architecture', value: parsed.cpu.architecture }
                                ]}
                            />

                            {/* Engine */}
                            <InfoCard
                                title="Engine"
                                items={[
                                    { label: 'Name', value: parsed.engine.name },
                                    { label: 'Version', value: parsed.engine.version }
                                ]}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function InfoCard({ title, items }: { title: string, items: { label: string, value: string | undefined }[] }) {
    // Only render if at least one item has a value
    const hasValue = items.some(i => i.value)
    if (!hasValue) return null

    return (
        <Card className="bg-muted/50">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
                    <MonitorSmartphone className="h-4 w-4" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2">
                {items.map((item, idx) => (
                    item.value ? (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.label}:</span>
                            <span className="font-semibold text-foreground">{item.value}</span>
                        </div>
                    ) : null
                ))}
            </CardContent>
        </Card>
    )
}
