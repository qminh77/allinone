'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Loader2, Copy, Check, RefreshCw, KeyRound } from 'lucide-react'
import { generatePassword, PasswordOptions } from '@/lib/actions/password'

export function PasswordGenerator() {
    const [password, setPassword] = useState('')
    const [length, setLength] = useState([16])
    const [options, setOptions] = useState<PasswordOptions>({
        lowercase: true,
        uppercase: true,
        numbers: true,
        symbols: true
    })
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleGenerate = async () => {
        if (!options.lowercase && !options.uppercase && !options.numbers && !options.symbols) {
            return
        }
        setLoading(true)
        try {
            const res = await generatePassword(length[0], options)
            setPassword(res)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (!password) return
        navigator.clipboard.writeText(password)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const toggleOption = (key: keyof PasswordOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Strong Password Generator</CardTitle>
                    <CardDescription>
                        Tạo mật khẩu mạnh và an toàn với các tùy chọn tùy chỉnh.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Output Display */}
                    <div className="relative">
                        <div className="flex items-center gap-2">
                            <div className="relative w-full">
                                <Input
                                    value={password}
                                    readOnly
                                    className="pr-12 h-12 text-lg font-mono bg-muted"
                                    placeholder="Generated password will appear here..."
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-10 w-10"
                                    onClick={copyToClipboard}
                                    disabled={!password}
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-base">Password Length: {length[0]}</Label>
                                <span className="text-sm text-muted-foreground">4 - 64 characters</span>
                            </div>
                            <Slider
                                value={length}
                                onValueChange={setLength}
                                max={64}
                                min={4}
                                step={1}
                                className="py-2"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                                <Label htmlFor="uppercase" className="flex-1 cursor-pointer">Uppercase (A-Z)</Label>
                                <Switch
                                    id="uppercase"
                                    checked={options.uppercase}
                                    onCheckedChange={() => toggleOption('uppercase')}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                                <Label htmlFor="lowercase" className="flex-1 cursor-pointer">Lowercase (a-z)</Label>
                                <Switch
                                    id="lowercase"
                                    checked={options.lowercase}
                                    onCheckedChange={() => toggleOption('lowercase')}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                                <Label htmlFor="numbers" className="flex-1 cursor-pointer">Numbers (0-9)</Label>
                                <Switch
                                    id="numbers"
                                    checked={options.numbers}
                                    onCheckedChange={() => toggleOption('numbers')}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                                <Label htmlFor="symbols" className="flex-1 cursor-pointer">Symbols (!@#$)</Label>
                                <Switch
                                    id="symbols"
                                    checked={options.symbols}
                                    onCheckedChange={() => toggleOption('symbols')}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading || (!options.lowercase && !options.uppercase && !options.numbers && !options.symbols)}
                            className="w-full h-11 text-base"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Generate Password
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
