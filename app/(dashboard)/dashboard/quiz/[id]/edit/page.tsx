import { ToolShell } from '@/components/dashboard/ToolShell'
import { getQuizWithDetails } from '@/lib/actions/quiz'
import { QuizForm } from '@/components/quiz/QuizForm'
import { QuestionList } from '@/components/quiz/QuestionList'
import { FileText } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Separator } from '@/components/ui/separator'

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
            <div className="grid xl:grid-cols-3 gap-8 max-w-7xl">
                {/* Left Column: Quiz Info */}
                <div className="xl:col-span-1 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Thông tin chung</h3>
                        <QuizForm quiz={quiz} isEditing />
                    </div>
                </div>

                {/* Right Column: Questions */}
                <div className="xl:col-span-2 space-y-6">
                    <Separator className="xl:hidden" />
                    <QuestionList quizId={quiz.id} questions={quiz.questions || []} />
                </div>
            </div>
        </ToolShell>
    )
}
