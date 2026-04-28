'use client'

import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { KeyRound, Loader2, LogIn, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { joinFlashcardSetByToken, type FlashcardSetWithCards } from '@/lib/actions/flashcards'
import { FlashcardStudyMode } from '@/components/flashcards/FlashcardStudyMode'

interface LocalSharedSet {
    id: string
    title: string
    token: string
    savedAt: string
}

const SHARED_KEY = 'allinone-flashcard-shared'

function readSharedSets(): LocalSharedSet[] {
    if (typeof window === 'undefined') return []
    try {
        return JSON.parse(window.localStorage.getItem(SHARED_KEY) || '[]')
    } catch {
        return []
    }
}

function saveSharedSet(entry: LocalSharedSet) {
    const current = readSharedSets().filter(item => item.id !== entry.id)
    const next = [entry, ...current].slice(0, 30)
    window.localStorage.setItem(SHARED_KEY, JSON.stringify(next))
    return next
}

export function FlashcardJoin() {
    const [token, setToken] = useState('')
    const [sharedSets, setSharedSets] = useState<LocalSharedSet[]>([])
    const [set, setSet] = useState<FlashcardSetWithCards | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setSharedSets(readSharedSets())
    }, [])

    const normalizedToken = useMemo(() => token.trim(), [token])

    async function handleJoin(event?: React.FormEvent<HTMLFormElement>) {
        event?.preventDefault()
        if (!normalizedToken) return

        setIsLoading(true)
        try {
            const result = await joinFlashcardSetByToken({
                token: normalizedToken,
            })

            if (result.error) {
                toast.error(result.error)
                return
            }

            if (result.set) {
                setSet(result.set)
                const next = saveSharedSet({
                    id: result.set.id,
                    title: result.set.title,
                    token: result.token || normalizedToken,
                    savedAt: new Date().toISOString(),
                })
                setSharedSets(next)
                toast.success('Đã mở flashcard set')
            }
        } catch {
            toast.error('Không thể xác thực token')
        } finally {
            setIsLoading(false)
        }
    }

    if (set) {
        return (
            <div className="space-y-6">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-2 flex flex-wrap gap-2">
                                <Badge variant="secondary">Token access</Badge>
                                <Badge variant="outline">{set.card_count} cards</Badge>
                            </div>
                            <h1 className="text-2xl font-semibold">{set.title}</h1>
                            {set.description && <p className="mt-1 text-sm text-muted-foreground">{set.description}</p>}
                        </div>
                        <Button type="button" variant="outline" onClick={() => setSet(null)}>
                            Nhập token khác
                        </Button>
                    </div>
                </div>
                <FlashcardStudyMode set={set} />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="size-5" />
                        Join flashcard bằng token
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleJoin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="flashcard-token">Token</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="flashcard-token"
                                    value={token}
                                    onChange={(event) => setToken(event.target.value)}
                                    placeholder="Dán token hoặc link /flashcard/..."
                                    className="pl-9 font-mono"
                                    maxLength={160}
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={!normalizedToken || isLoading} className="w-full">
                            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                            Vào học
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {sharedSets.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Shared with me trên trình duyệt này</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {sharedSets.slice(0, 8).map(item => (
                            <button
                                key={`${item.id}-${item.token}`}
                                type="button"
                                className="flex w-full items-center justify-between rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted/50"
                                onClick={() => {
                                    setToken(item.token)
                                }}
                            >
                                <span className="font-medium">{item.title}</span>
                                <code className="rounded bg-muted px-2 py-1 font-mono text-xs">{item.token}</code>
                            </button>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
