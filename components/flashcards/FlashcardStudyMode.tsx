'use client'

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { ArrowLeftRight, Check, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { MarkdownDefinition } from '@/components/flashcards/MarkdownDefinition'
import { cn } from '@/lib/utils'
import {
    saveFlashcardProgress,
    type FlashcardCard,
    type FlashcardProgressStatus,
    type FlashcardSetWithCards,
} from '@/lib/actions/flashcards'

interface FlashcardStudyModeProps {
    set: FlashcardSetWithCards
    persistToServer?: boolean
}

function shuffleCards(cards: FlashcardCard[]) {
    const next = [...cards]
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[next[i], next[j]] = [next[j], next[i]]
    }
    return next
}

function getStorageKey(setId: string) {
    return `allinone-flashcard-progress:${setId}`
}

function readLocalProgress(setId: string): Record<string, FlashcardProgressStatus> {
    if (typeof window === 'undefined') return {}

    try {
        const raw = window.localStorage.getItem(getStorageKey(setId))
        if (!raw) return {}
        const parsed = JSON.parse(raw) as Record<string, FlashcardProgressStatus>
        return parsed || {}
    } catch {
        return {}
    }
}

function buildInitialProgress(set: FlashcardSetWithCards) {
    const serverProgress = set.cards.reduce<Record<string, FlashcardProgressStatus>>((acc, card) => {
        if (card.status) acc[card.id] = card.status
        return acc
    }, {})

    return { ...serverProgress, ...readLocalProgress(set.id) }
}

export function FlashcardStudyMode({ set, persistToServer = true }: FlashcardStudyModeProps) {
    const [deck, setDeck] = useState(() => set.cards)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [definitionFirst, setDefinitionFirst] = useState(false)
    const [progressByCard, setProgressByCard] = useState<Record<string, FlashcardProgressStatus>>(() => buildInitialProgress(set))

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(getStorageKey(set.id), JSON.stringify(progressByCard))
    }, [progressByCard, set.id])

    const currentCard = deck[currentIndex]
    const completedCount = useMemo(() => {
        return set.cards.filter(card => {
            const status = progressByCard[card.id]
            return status === 'known' || status === 'mastered'
        }).length
    }, [set.cards, progressByCard])
    const masteredCount = useMemo(() => set.cards.filter(card => progressByCard[card.id] === 'mastered').length, [set.cards, progressByCard])
    const progressPercent = set.cards.length > 0 ? Math.round((completedCount / set.cards.length) * 100) : 0

    function move(delta: number) {
        setCurrentIndex(index => Math.min(deck.length - 1, Math.max(0, index + delta)))
        setIsFlipped(false)
    }

    async function markStatus(status: FlashcardProgressStatus) {
        if (!currentCard) return

        setProgressByCard(prev => ({ ...prev, [currentCard.id]: status }))

        if (persistToServer) {
            const result = await saveFlashcardProgress(set.id, currentCard.id, status)
            if (result.error && result.error !== 'Unauthorized') {
                toast.error(result.error)
            }
        }

        if (currentIndex < deck.length - 1) {
            move(1)
        }
    }

    function resetSession() {
        setDeck(set.cards)
        setCurrentIndex(0)
        setIsFlipped(false)
    }

    if (set.cards.length === 0) {
        return (
            <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center text-sm text-muted-foreground">
                Set này chưa có card để học.
            </div>
        )
    }

    const frontText = definitionFirst ? currentCard?.definition : currentCard?.term
    const backText = definitionFirst ? currentCard?.term : currentCard?.definition
    const currentStatus = currentCard ? progressByCard[currentCard.id] : null
    const frontIsDefinition = definitionFirst
    const backIsDefinition = !definitionFirst

    function renderFaceContent(value: string, isDefinition: boolean) {
        return (
            <div className={cn(
                'max-h-[250px] w-full max-w-2xl overflow-y-auto px-1',
                isDefinition ? 'text-left' : 'text-center'
            )}>
                {isDefinition ? (
                    <MarkdownDefinition value={value} className="text-base font-normal leading-relaxed sm:text-lg" />
                ) : (
                    <p className="whitespace-pre-wrap break-words text-xl font-semibold leading-relaxed sm:text-2xl">
                        {value}
                    </p>
                )}
            </div>
        )
    }

    function renderFace(label: string, value: string, isDefinition: boolean, isBack = false) {
        return (
            <Card
                className="absolute inset-0 flex min-h-[340px] flex-col overflow-hidden border-2 py-5 transition-colors hover:border-primary/50"
                style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                <CardHeader className="px-5 sm:px-6">
                    <CardTitle className="flex items-center justify-between gap-3 text-base">
                        <span>{label}</span>
                        <span className="text-sm font-normal text-muted-foreground">Click để lật thẻ</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 items-center justify-center px-5 pb-6 pt-0 sm:px-8">
                    {renderFaceContent(value, isDefinition)}
                </CardContent>
            </Card>
        )
    }

    function handleFlipKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key !== 'Enter' && event.key !== ' ') return

        event.preventDefault()
        setIsFlipped(value => !value)
    }

    return (
        <div className="mx-auto max-w-4xl space-y-5">
            <div className="rounded-lg border bg-card p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{currentIndex + 1}/{deck.length}</Badge>
                            <Badge variant="secondary">{progressPercent}% hoàn thành</Badge>
                            <Badge variant="outline">{masteredCount} mastered</Badge>
                            {currentStatus && <Badge>{currentStatus}</Badge>}
                        </div>
                        <Progress value={progressPercent} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                            <ArrowLeftRight className="size-4 text-muted-foreground" />
                            <Label htmlFor="definition-first" className="text-sm">Definition trước</Label>
                            <Switch id="definition-first" checked={definitionFirst} onCheckedChange={(checked) => {
                                setDefinitionFirst(checked)
                                setIsFlipped(false)
                            }} />
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                            setDeck(prev => shuffleCards(prev))
                            setCurrentIndex(0)
                            setIsFlipped(false)
                        }}>
                            <Shuffle className="size-4" />
                            Shuffle
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={resetSession}>
                            <RotateCcw className="size-4" />
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            <div
                role="button"
                tabIndex={0}
                className="block w-full cursor-pointer rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setIsFlipped(value => !value)}
                onKeyDown={handleFlipKeyDown}
                aria-pressed={isFlipped}
                style={{ perspective: '1400px' }}
            >
                <div
                    className="relative min-h-[340px] transition-transform duration-500 motion-reduce:transition-none"
                    style={{
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {renderFace('Mặt trước', frontText || '', frontIsDefinition)}
                    {renderFace('Mặt sau', backText || '', backIsDefinition, true)}
                </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Button type="button" variant="outline" onClick={() => move(-1)} disabled={currentIndex === 0}>
                    <ChevronLeft className="size-4" />
                    Trước
                </Button>

                <div className="flex flex-wrap justify-center gap-2">
                    <Button type="button" variant="outline" onClick={() => markStatus('unknown')}>
                        <X className="size-4" />
                        Chưa biết
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => markStatus('known')}>
                        <Check className="size-4" />
                        Biết
                    </Button>
                    <Button type="button" onClick={() => markStatus('mastered')}>
                        <Star className="size-4" />
                        Mastered
                    </Button>
                </div>

                <Button type="button" variant="outline" onClick={() => move(1)} disabled={currentIndex === deck.length - 1}>
                    Sau
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    )
}
