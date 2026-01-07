import { ToolShell } from '@/components/dashboard/ToolShell'
import { History } from 'lucide-react'
import { getQuizHistory } from '@/lib/actions/quiz'
import { QuizHistoryTable } from '@/components/quiz/QuizHistoryTable'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
    const history = await getQuizHistory()

    return (
        <ToolShell
            title="Lịch sử làm bài"
            description="Xem lại kết quả các bài trắc nghiệm bạn đã thực hiện."
            icon={History}
        >
            <QuizHistoryTable history={history} />
        </ToolShell>
    )
}
