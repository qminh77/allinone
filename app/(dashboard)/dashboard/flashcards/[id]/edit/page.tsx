import { notFound } from 'next/navigation'
import { Layers } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { FlashcardSetEditClient } from '@/components/flashcards/FlashcardSetEditClient'
import { getOwnedFlashcardSetWithCards } from '@/lib/actions/flashcards'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditFlashcardSetPage({ params }: PageProps) {
    const { id } = await params
    const set = await getOwnedFlashcardSetWithCards(id)

    if (!set) {
        notFound()
    }

    return (
        <ToolShell
            title={`Chỉnh sửa: ${set.title}`}
            description="Quản lý thông tin set, card, import/export và token chia sẻ."
            icon={Layers}
        >
            <FlashcardSetEditClient set={set} />
        </ToolShell>
    )
}
