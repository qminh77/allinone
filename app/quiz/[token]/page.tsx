import { ToolShell } from '@/components/dashboard/ToolShell'
import { QuizPlayer } from '@/components/quiz/QuizPlayer'
import { Play } from 'lucide-react'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

interface PageProps {
    params: {
        token: string
    }
}

export default async function PublicQuizPage({ params }: PageProps) {
    const { token } = await params

    const supabase = createAdminClient()

    // 1. Try to find by share_token
    const { data: quizByToken } = await supabase
        .from('quizzes')
        .select(`
            *,
            quiz_questions (
                *,
                quiz_answers (*)
            )
        `)
        .eq('share_token', token)
        .single()

    let quiz: any = quizByToken

    // 2. If not found by token, try by ID if it's a valid UUID (and IS PUBLIC)
    if (!quiz) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(token)) {
            const { data: quizById } = await supabase
                .from('quizzes')
                .select(`
                    *,
                    quiz_questions (
                        *,
                        quiz_answers (*)
                    )
                `)
                .eq('id', token)
                .eq('is_public', true) // Must be public if accessing by ID
                .single()
            quiz = quizById
        }
    }

    if (!quiz) {
        notFound()
    }

    // Sort questions and answers
    // Sort questions and answers
    if (quiz.quiz_questions) {
        quiz.quiz_questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        quiz.quiz_questions.forEach((q: any) => {
            if (q.quiz_answers) {
                q.quiz_answers.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            }
        })
    }

    return (
        <div className="container max-w-4xl py-10">
            <ToolShell
                title={quiz.title}
                description={quiz.description || "Làm bài trắc nghiệm"}
                icon={Play}
            >
                <QuizPlayer quiz={quiz as any} />
            </ToolShell>
        </div>
    )
}
