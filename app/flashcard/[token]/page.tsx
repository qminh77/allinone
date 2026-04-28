import { notFound } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { FlashcardStudyMode } from '@/components/flashcards/FlashcardStudyMode'
import { getPublicFlashcardSetByToken } from '@/lib/actions/flashcards'

interface PageProps {
    params: Promise<{
        token: string
    }>
}

export default async function PublicFlashcardPage({ params }: PageProps) {
    const { token } = await params
    const result = await getPublicFlashcardSetByToken(token)

    if (result.error || !result.set) {
        notFound()
    }

    return (
        <div className="container mx-auto max-w-5xl py-10">
            <ToolShell
                title={result.set.title}
                description={result.set.description || 'Học flashcard được chia sẻ'}
                icon={BookOpen}
            >
                <FlashcardStudyMode set={result.set} persistToServer={false} />
            </ToolShell>
        </div>
    )
}
