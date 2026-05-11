import { BookPlus } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { FlashcardSetFormClient } from '@/components/flashcards/FlashcardSetFormClient'

export default function CreateFlashcardSetPage() {
    return (
        <ToolShell
            title="Tạo flashcard set"
            description="Tạo set mới với tiêu đề, mô tả và visibility Public hoặc Private."
            icon={BookPlus}
        >
            <div className="mx-auto max-w-3xl">
                <FlashcardSetFormClient />
            </div>
        </ToolShell>
    )
}
