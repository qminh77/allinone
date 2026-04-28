'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, GripVertical, Loader2, Plus, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    createFlashcardCard,
    deleteFlashcardCard,
    reorderFlashcardCards,
    updateFlashcardCard,
    type FlashcardCard,
} from '@/lib/actions/flashcards'
import { MarkdownDefinition } from '@/components/flashcards/MarkdownDefinition'
import { BulkImportFlashcardsDialog } from '@/components/flashcards/BulkImportFlashcardsDialog'

interface FlashcardCardManagerProps {
    setId: string
    cards: FlashcardCard[]
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
    const next = [...items]
    const [item] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, item)
    return next
}

export function FlashcardCardManager({ setId, cards: initialCards }: FlashcardCardManagerProps) {
    const router = useRouter()
    const [cards, setCards] = useState(initialCards)
    const [term, setTerm] = useState('')
    const [definition, setDefinition] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTerm, setEditTerm] = useState('')
    const [editDefinition, setEditDefinition] = useState('')
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        setCards(initialCards)
    }, [initialCards])

    const orderedIds = useMemo(() => cards.map(card => card.id), [cards])

    async function handleCreate() {
        if (!term.trim() || !definition.trim()) {
            toast.error('Term và Definition không được để trống')
            return
        }

        setIsCreating(true)
        try {
            const result = await createFlashcardCard(setId, { term, definition })
            if (result.error) {
                toast.error(result.error)
                return
            }

            if (result.data) {
                setCards(prev => [...prev, result.data])
            }
            setTerm('')
            setDefinition('')
            toast.success('Đã thêm card')
            router.refresh()
        } catch {
            toast.error('Không thể thêm card')
        } finally {
            setIsCreating(false)
        }
    }

    function startEdit(card: FlashcardCard) {
        setEditingId(card.id)
        setEditTerm(card.term)
        setEditDefinition(card.definition)
    }

    async function handleUpdate(cardId: string) {
        setSavingId(cardId)
        try {
            const result = await updateFlashcardCard(cardId, { term: editTerm, definition: editDefinition })
            if (result.error) {
                toast.error(result.error)
                return
            }

            setCards(prev => prev.map(card => (
                card.id === cardId
                    ? { ...card, term: editTerm.trim(), definition: editDefinition.trim(), updated_at: new Date().toISOString() }
                    : card
            )))
            setEditingId(null)
            toast.success('Đã cập nhật card')
            router.refresh()
        } catch {
            toast.error('Không thể cập nhật card')
        } finally {
            setSavingId(null)
        }
    }

    async function handleDelete(cardId: string) {
        if (!confirm('Bạn có chắc chắn muốn xóa card này?')) return

        setSavingId(cardId)
        try {
            const result = await deleteFlashcardCard(cardId)
            if (result.error) {
                toast.error(result.error)
                return
            }

            setCards(prev => prev.filter(card => card.id !== cardId))
            toast.success('Đã xóa card')
            router.refresh()
        } catch {
            toast.error('Không thể xóa card')
        } finally {
            setSavingId(null)
        }
    }

    async function persistOrder(nextCards: FlashcardCard[], previousCards: FlashcardCard[]) {
        setCards(nextCards)
        const result = await reorderFlashcardCards(setId, nextCards.map(card => card.id))
        if (result.error) {
            setCards(previousCards)
            toast.error(result.error)
            return
        }
        toast.success('Đã cập nhật thứ tự card')
        router.refresh()
    }

    function handleDrop(targetId: string) {
        if (!draggedId || draggedId === targetId) return

        const fromIndex = orderedIds.indexOf(draggedId)
        const toIndex = orderedIds.indexOf(targetId)
        if (fromIndex < 0 || toIndex < 0) return

        const previousCards = cards
        const nextCards = moveItem(cards, fromIndex, toIndex)
        setDraggedId(null)
        void persistOrder(nextCards, previousCards)
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Cards</h2>
                    <p className="text-sm text-muted-foreground">{cards.length} card trong set này</p>
                </div>
                <BulkImportFlashcardsDialog setId={setId} />
            </div>

            <Card className="border-dashed">
                <CardContent className="space-y-4 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <Input
                            value={term}
                            onChange={(event) => setTerm(event.target.value)}
                            placeholder="Term"
                            maxLength={500}
                        />
                        <Textarea
                            value={definition}
                            onChange={(event) => setDefinition(event.target.value)}
                            placeholder="Definition (hỗ trợ **bold**, *italic*, `code`, bullet list)"
                            className="min-h-20"
                            maxLength={5000}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="button" onClick={handleCreate} disabled={isCreating}>
                            {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                            Thêm card
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {cards.length === 0 && (
                    <div className="rounded-lg border border-dashed bg-muted/20 py-10 text-center text-sm text-muted-foreground">
                        Chưa có card nào. Thêm thủ công hoặc dùng Bulk import.
                    </div>
                )}

                {cards.map((card, index) => (
                    <Card
                        key={card.id}
                        draggable={editingId !== card.id}
                        onDragStart={() => setDraggedId(card.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDrop(card.id)}
                        className={draggedId === card.id ? 'opacity-60' : ''}
                    >
                        <CardContent className="p-4">
                            {editingId === card.id ? (
                                <div className="space-y-4">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <Input value={editTerm} onChange={(event) => setEditTerm(event.target.value)} maxLength={500} />
                                        <Textarea
                                            value={editDefinition}
                                            onChange={(event) => setEditDefinition(event.target.value)}
                                            className="min-h-24"
                                            maxLength={5000}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                                            <X className="size-4" />
                                            Hủy
                                        </Button>
                                        <Button type="button" size="sm" onClick={() => handleUpdate(card.id)} disabled={savingId === card.id}>
                                            {savingId === card.id ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                            Lưu
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <div className="flex shrink-0 flex-col items-center gap-2 text-muted-foreground">
                                        <GripVertical className="size-5 cursor-move" />
                                        <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="break-words text-base font-semibold">{card.term}</p>
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                <Button type="button" variant="ghost" size="icon-sm" onClick={() => startEdit(card)}>
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(card.id)}
                                                    disabled={savingId === card.id}
                                                >
                                                    {savingId === card.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="rounded-md border bg-muted/20 p-3 text-sm">
                                            <MarkdownDefinition value={card.definition} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
