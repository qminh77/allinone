import Link from 'next/link'
import type React from 'react'
import { BookOpen, Plus, Search } from 'lucide-react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FlashcardSetCard } from '@/components/flashcards/FlashcardSetCard'
import { ImportFlashcardDialog } from '@/components/flashcards/ImportFlashcardDialog'
import { getFlashcardLibrary } from '@/lib/actions/flashcards'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams?: Promise<{
        q?: string
    }>
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            {children || (
                <div className="rounded-lg border border-dashed bg-muted/20 py-10 text-center text-sm text-muted-foreground">
                    {empty}
                </div>
            )}
        </section>
    )
}

export default async function FlashcardLibraryPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams
    const q = resolvedSearchParams?.q?.trim() || ''
    const library = await getFlashcardLibrary(q)

    return (
        <ToolShell
            title="My Flashcard Library"
            description="Quản lý các flashcard set của bạn."
            icon={BookOpen}
        >
            <div className="space-y-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <form className="relative w-full lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            name="q"
                            defaultValue={q}
                            placeholder="Tìm flashcard set..."
                            className="bg-background pl-9"
                        />
                    </form>

                    <div className="flex flex-wrap gap-2">
                        <ImportFlashcardDialog />
                        <Button asChild variant="outline">
                            <Link href="/flashcard/join">
                                Join bằng token
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard/flashcards/create">
                                <Plus className="size-4" />
                                Tạo set
                            </Link>
                        </Button>
                    </div>
                </div>

                <Section title="Bộ của tôi" empty="Bạn chưa có flashcard set nào.">
                    {library.own.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {library.own.map(set => <FlashcardSetCard key={set.id} set={set} />)}
                        </div>
                    )}
                </Section>

                {q && (
                    <Section title="Public search" empty={`Không tìm thấy set public phù hợp với "${q}".`}>
                        {library.public.length > 0 && (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {library.public.map(set => <FlashcardSetCard key={set.id} set={set} />)}
                            </div>
                        )}
                    </Section>
                )}
            </div>
        </ToolShell>
    )
}
