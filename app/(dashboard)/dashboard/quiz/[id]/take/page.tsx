import { ToolShell } from '@/components/dashboard/ToolShell'
import { getQuizWithDetails } from '@/lib/actions/quiz'
import { QuizPlayerClient } from '@/components/quiz/QuizPlayerClient'
import { Play } from 'lucide-react'
import { notFound } from 'next/navigation'

interface PageProps {
    params: {
        id: string
    }
}

export default async function TakeQuizPage({ params }: PageProps) {
    const { id } = await params
    const quiz = await getQuizWithDetails(id)

    if (!quiz) {
        notFound()
    }

    return (
        <ToolShell
            title={quiz.title}
            description={quiz.description || "Làm bài trắc nghiệm"}
            icon={Play}
        >
            <QuizPlayerClient quiz={quiz} />
        </ToolShell>
    )
}
