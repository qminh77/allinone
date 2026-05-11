'use client'

import dynamic from 'next/dynamic'
import type { FlashcardSetEditContentProps } from '@/components/flashcards/FlashcardSetEditContent'

const FlashcardSetEditContent = dynamic(
    () => import('@/components/flashcards/FlashcardSetEditContent').then(module => module.FlashcardSetEditContent),
    {
        ssr: false,
        loading: () => <div className="h-[36rem] rounded-lg border bg-muted/20 animate-pulse" />,
    }
)

export function FlashcardSetEditClient(props: FlashcardSetEditContentProps) {
    return <FlashcardSetEditContent {...props} />
}
