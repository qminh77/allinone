import { BookPlus } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { FlashcardSetForm } from '@/components/flashcards/FlashcardSetForm'

export default function CreateFlashcardSetPage() {
    return (
        <ToolShell
            title="Tạo flashcard set"
            description="Tạo set mới với tiêu đề, mô tả và visibility Public hoặc Private."
            icon={BookPlus}
        >
            <div className="mx-auto max-w-3xl">
                <FlashcardSetForm />
            </div>
        </ToolShell>
    )
}
