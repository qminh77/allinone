import { notFound } from 'next/navigation'
import { Layers } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Separator } from '@/components/ui/separator'
import { FlashcardSetForm } from '@/components/flashcards/FlashcardSetForm'
import { FlashcardCardManager } from '@/components/flashcards/FlashcardCardManager'
import { FlashcardExportButtons } from '@/components/flashcards/FlashcardExportButtons'
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
        </ToolShell>
    )
}
