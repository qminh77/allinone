'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from "@/components/ui/slider"
import { Loader2, Lock, ShieldCheck, Check, Copy, RefreshCw } from 'lucide-react'
import { hashPassword, comparePassword } from '@/lib/actions/bcrypt'
import { cn } from '@/lib/utils'

export function BcryptGenerator() {
    // Hash State
    const [hashInput, setHashInput] = useState('')
    const [rounds, setRounds] = useState([10])
    const [hashOutput, setHashOutput] = useState('')
    const [hashLoading, setHashLoading] = useState(false)
    const [hashCopied, setHashCopied] = useState(false)

    // Compare State
    const [compareText, setCompareText] = useState('')
    const [compareHash, setCompareHash] = useState('')
    const [compareResult, setCompareResult] = useState<boolean | null>(null)
    const [compareLoading, setCompareLoading] = useState(false)

    const handleHash = async () => {
        if (!hashInput) return
        setHashLoading(true)
        try {
            const res = await hashPassword(hashInput, rounds[0])
            setHashOutput(res)
        } finally {
            setHashLoading(false)
        }
    }

    const handleCompare = async () => {
        if (!compareText || !compareHash) return
        setCompareLoading(true)
        try {
            const res = await comparePassword(compareText, compareHash)
            setCompareResult(res)
        } finally {
            setCompareLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (!hashOutput) return
        navigator.clipboard.writeText(hashOutput)
        setHashCopied(true)
        setTimeout(() => setHashCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="hash" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="hash" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Generate Hash
                    </TabsTrigger>
                    <TabsTrigger value="compare" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Check Password
                    </TabsTrigger>
                </TabsList>

                {/* Hash Tab */}
                <TabsContent value="hash" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Bcrypt Hash</CardTitle>
                            <CardDescription>
                                Tạo mã băm mật khẩu an toàn sử dụng thuật toán Bcrypt.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Password / Text</Label>
                                <Input
                                    type="text"
                                    placeholder="Enter password..."
                                    value={hashInput}
                                    onChange={(e) => setHashInput(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label>Salt Rounds: {rounds[0]}</Label>
                                    <span className="text-sm text-muted-foreground">Range: 8-16 (Higher is slower)</span>
                                </div>
                                <Slider
                                    value={rounds}
                                    onValueChange={setRounds}
                                    max={16}
                                    min={8}
                                    step={1}
                                    className="py-4"
                                />
                            </div>

                            <Button onClick={handleHash} disabled={hashLoading || !hashInput}>
                                {hashLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Generate Hash
                            </Button>

                            {hashOutput && (
                                <div className="space-y-2 pt-2">
                                    <Label>Hash Output</Label>
                                    <div className="flex gap-2">
                                        <Input value={hashOutput} readOnly className="font-mono bg-muted" />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={copyToClipboard}
                                            title="Copy hash"
                                        >
                                            {hashCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Compare Tab */}
                <TabsContent value="compare" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compare Hash</CardTitle>
                            <CardDescription>
                                Kiểm tra một mật khẩu có khớp với mã băm Bcrypt hay không.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Plain Password</Label>
                                <Input
                                    type="text"
                                    placeholder="Enter plain password to check..."
                                    value={compareText}
                                    onChange={(e) => {
                                        setCompareText(e.target.value)
                                        setCompareResult(null)
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Bcrypt Hash</Label>
                                <Input
                                    type="text"
                                    placeholder="$2a$10$..."
                                    value={compareHash}
                                    onChange={(e) => {
                                        setCompareHash(e.target.value)
                                        setCompareResult(null)
                                    }}
                                    className="font-mono text-sm"
                                />
                            </div>

                            <Button onClick={handleCompare} disabled={compareLoading || !compareText || !compareHash}>
                                {compareLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                Check Match
                            </Button>

                            {compareResult !== null && (
                                <div className={cn(
                                    "p-4 rounded-md flex items-center gap-3 font-medium border",
                                    compareResult ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"
                                )}>
                                    {compareResult ? (
                                        <>
                                            <Check className="h-5 w-5" />
                                            Password Matches!
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-5 w-5" />
                                            Password Does NOT Match
                                        </>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
