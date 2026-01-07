'use client'

import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { resetHistory } from '@/lib/actions/quiz'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface HistoryItem {
    id: string
    quiz_id: string
    score: number
    total_questions: number
    started_at: string
    completed_at: string | null
    quizzes: {
        title: string
    } | null // Join result
}

interface QuizHistoryTableProps {
    history: any[] // Using any to avoid complex TS mapping from raw query result if types mismatch slightly
}

export function QuizHistoryTable({ history }: QuizHistoryTableProps) {
    const router = useRouter()

    const handleReset = async () => {
        if (!confirm('Bạn có chắc muốn xóa toàn bộ lịch sử làm bài?')) return
        const res = await resetHistory()
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Đã xóa lịch sử')
            router.refresh()
        }
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                Bạn chưa thực hiện bài trắc nghiệm nào.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="destructive" size="sm" onClick={handleReset}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa lịch sử
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên bộ câu hỏi</TableHead>
                            <TableHead>Ngày làm</TableHead>
                            <TableHead>Kết quả</TableHead>
                            <TableHead>Trạng thái</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((attempt) => {
                            const percent = attempt.total_questions > 0 ? (attempt.score / attempt.total_questions) * 100 : 0
                            return (
                                <TableRow key={attempt.id}>
                                    <TableCell className="font-medium">
                                        {attempt.quizzes?.title || 'Unknown Quiz'}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(attempt.started_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{attempt.score}/{attempt.total_questions}</span>
                                            <span className="text-xs text-muted-foreground">({percent.toFixed(0)}%)</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {percent === 100 ? (
                                            <Badge className="bg-green-600 hover:bg-green-700">Xuất sắc</Badge>
                                        ) : percent >= 50 ? (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Đạt</Badge>
                                        ) : (
                                            <Badge variant="destructive">Chưa đạt</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
