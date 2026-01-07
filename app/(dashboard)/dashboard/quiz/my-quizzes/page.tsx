import { ToolShell } from '@/components/dashboard/ToolShell'
import { ListFilter, Plus, MoreHorizontal, Play, Edit, Trash2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getQuizzes, type Quiz } from '@/lib/actions/quiz'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteQuizButton } from '@/components/quiz/DeleteQuizButton'
import { ImportQuizDialog } from '@/components/quiz/ImportQuizDialog'
import { CopyLinkMenuItem } from '@/components/quiz/CopyLinkMenuItem'

export const dynamic = 'force-dynamic'

export default async function MyQuizzesPage() {
    const quizzes = await getQuizzes()

    return (
        <ToolShell
            title="Danh sách câu hỏi của tôi"
            description="Quản lý các bộ câu hỏi trắc nghiệm của bạn."
            icon={ListFilter}
        >
            <div className="space-y-6">
                <div className="flex justify-end gap-2">
                    <ImportQuizDialog />
                    <Link href="/dashboard/quiz/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo mới
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quizzes.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                            Chưa có bộ câu hỏi nào. Hãy tạo mới ngay!
                        </div>
                    ) : quizzes.map((quiz: Quiz) => (
                        <Card key={quiz.id} className="hover:shadow-md transition-shadow group relative overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant={quiz.is_public ? "default" : "secondary"} className="mb-2">
                                        {quiz.is_public ? 'Public' : 'Private'}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <Link href={`/dashboard/quiz/${quiz.id}/edit`}>
                                                <DropdownMenuItem>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Chỉnh sửa
                                                </DropdownMenuItem>
                                            </Link>
                                            <Link href={`/dashboard/quiz/${quiz.id}/take`}>
                                                <DropdownMenuItem>
                                                    <Play className="mr-2 h-4 w-4" />
                                                    Làm bài thử
                                                </DropdownMenuItem>
                                            </Link>

                                            <CopyLinkMenuItem quizId={quiz.id} shareToken={quiz.share_token} />
                                            <DeleteQuizButton id={quiz.id} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="line-clamp-1" title={quiz.title}>{quiz.title}</CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">
                                    {quiz.description || "Không có mô tả"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground pt-4 border-t flex justify-between items-center">
                                    <span>{format(new Date(quiz.created_at), 'dd/MM/yyyy', { locale: vi })}</span>
                                    <Link href={`/dashboard/quiz/${quiz.id}/take`}>
                                        <Button size="sm" variant="secondary" className="h-7 text-xs">
                                            <Play className="mr-1 h-3 w-3" /> Start
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </ToolShell >
    )
}
