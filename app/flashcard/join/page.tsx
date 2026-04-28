import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FlashcardJoin } from '@/components/flashcards/FlashcardJoin'

export default function FlashcardJoinPage() {
    return (
        <main className="min-h-screen bg-muted/20 px-4 py-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-md bg-primary/10 p-2 text-primary">
                            <BookOpen className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">Flashcard Join</h1>
                            <p className="text-sm text-muted-foreground">Nhập token để xem và học set được chia sẻ.</p>
                        </div>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/flashcards/library">My Library</Link>
                    </Button>
                </div>

                <FlashcardJoin />
            </div>
        </main>
    )
}
