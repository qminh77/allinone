import { ToolShell } from '@/components/dashboard/ToolShell'
import { getQuizWithDetails } from '@/lib/actions/quiz'
import { QuizEditClient } from '@/components/quiz/QuizEditClient'
import { FileText } from 'lucide-react'
import { notFound } from 'next/navigation'

interface PageProps {
    params: {
        id: string
    }
}

export default async function EditQuizPage({ params }: PageProps) {
    const { id } = await params
    const quiz = await getQuizWithDetails(id)

    if (!quiz) {
        notFound()
    }

    return (
        <ToolShell
            title={`Chỉnh sửa: ${quiz.title}`}
            description="Cập nhật thông tin và quản lý câu hỏi."
            icon={FileText}
        >
            <QuizEditClient quiz={quiz} />
        </ToolShell>
    )
}
