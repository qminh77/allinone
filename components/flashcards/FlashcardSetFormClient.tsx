'use client'

import dynamic from 'next/dynamic'

const FlashcardSetForm = dynamic(
    () => import('@/components/flashcards/FlashcardSetForm').then(module => module.FlashcardSetForm),
    {
        ssr: false,
        loading: () => <div className="h-96 rounded-lg border bg-muted/20 animate-pulse" />,
    }
)

export function FlashcardSetFormClient() {
    return <FlashcardSetForm />
}
