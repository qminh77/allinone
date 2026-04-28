import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { BookOpen, Edit, MoreHorizontal, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { DeleteFlashcardSetButton } from '@/components/flashcards/DeleteFlashcardSetButton'
import { CopyFlashcardTokenMenuItem } from '@/components/flashcards/CopyFlashcardTokenMenuItem'
import type { FlashcardSetSummary } from '@/lib/actions/flashcards'

export function FlashcardSetCard({ set }: { set: FlashcardSetSummary }) {
    return (
        <Card className="group transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant={set.visibility === 'public' ? 'secondary' : 'outline'}>
                            {set.visibility === 'public' ? 'Public' : 'Private'}
                        </Badge>
                        {!set.is_owner && <Badge variant="outline">Shared</Badge>}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <Link href={`/dashboard/flashcards/${set.id}/study`}>
                                <DropdownMenuItem>
                                    <Play className="mr-2 size-4" />
                                    Học
                                </DropdownMenuItem>
                            </Link>
                            {set.is_owner && (
                                <Link href={`/dashboard/flashcards/${set.id}/edit`}>
                                    <DropdownMenuItem>
                                        <Edit className="mr-2 size-4" />
                                        Chỉnh sửa
                                    </DropdownMenuItem>
                                </Link>
                            )}
                            {set.is_owner && <CopyFlashcardTokenMenuItem setId={set.id} shareToken={set.share_token} />}
                            {set.is_owner && <DeleteFlashcardSetButton id={set.id} />}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardTitle className="line-clamp-1" title={set.title}>{set.title}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-10">
                    {set.description || 'Không có mô tả'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-md bg-muted/50 p-2">
                        <div className="font-semibold">{set.card_count}</div>
                        <div className="text-xs text-muted-foreground">cards</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                        <div className="font-semibold">{set.completed_count}</div>
                        <div className="text-xs text-muted-foreground">đã biết</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                        <div className="font-semibold">{set.mastered_count}</div>
                        <div className="text-xs text-muted-foreground">mastered</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tiến trình</span>
                        <span>{set.progress_percent}%</span>
                    </div>
                    <Progress value={set.progress_percent} />
                </div>

                <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span>{format(new Date(set.created_at), 'dd/MM/yyyy', { locale: vi })}</span>
                    <Button asChild size="sm" variant="secondary" className="h-8">
                        <Link href={`/dashboard/flashcards/${set.id}/study`}>
                            <BookOpen className="size-4" />
                            Học ngay
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
