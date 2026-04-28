import { notFound } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { FlashcardStudyMode } from '@/components/flashcards/FlashcardStudyMode'
import { getFlashcardSetForStudy } from '@/lib/actions/flashcards'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function StudyFlashcardSetPage({ params }: PageProps) {
    const { id } = await params
    const set = await getFlashcardSetForStudy(id)

    if (!set) {
        notFound()
    }

    return (
        <ToolShell
            title={set.title}
            description={set.description || 'Học flashcard với chế độ lật thẻ, shuffle và tracking tiến trình.'}
            icon={BookOpen}
        >
            <FlashcardStudyMode set={set} />
        </ToolShell>
    )
}
