'use client'

import type { ComponentProps } from 'react'
import { Separator } from '@/components/ui/separator'
import { FlashcardSetForm } from '@/components/flashcards/FlashcardSetForm'
import { FlashcardCardManager } from '@/components/flashcards/FlashcardCardManager'
import { FlashcardExportButtons } from '@/components/flashcards/FlashcardExportButtons'

type FlashcardSet = NonNullable<ComponentProps<typeof FlashcardSetForm>['set']>
type FlashcardCards = ComponentProps<typeof FlashcardCardManager>['cards']

export interface FlashcardSetEditContentProps {
    set: FlashcardSet & { cards: FlashcardCards }
}

export function FlashcardSetEditContent({ set }: FlashcardSetEditContentProps) {
    return (
        <div className="grid gap-8 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-1">
                <FlashcardSetForm set={set} isEditing />

                <div className="rounded-lg border bg-card p-4">
                    <h2 className="mb-3 text-lg font-semibold">Export</h2>
                    <p className="mb-4 text-sm text-muted-foreground">Chỉ owner được export set ra CSV hoặc TXT.</p>
                    <FlashcardExportButtons setId={set.id} />
                </div>
            </div>

            <div className="space-y-6 xl:col-span-2">
                <Separator className="xl:hidden" />
                <FlashcardCardManager setId={set.id} cards={set.cards} />
            </div>
        </div>
    )
}
