import { ToolShell } from '@/components/dashboard/ToolShell'
import { QuizPlayer } from '@/components/quiz/QuizPlayer'
import { Play } from 'lucide-react'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Quiz, Question } from '@/lib/actions/quiz'
import type { Database } from '@/types/database'

type QuizRow = Database['public']['Tables']['quizzes']['Row']
type QuizQuestionRow = Database['public']['Tables']['quiz_questions']['Row']
type QuizAnswerRow = Database['public']['Tables']['quiz_answers']['Row']
type QuizWithQuestions = QuizRow & {
    quiz_questions?: Array<QuizQuestionRow & {
        quiz_answers?: QuizAnswerRow[]
    }>
}

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

    let quiz = quizByToken as QuizWithQuestions | null

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
            quiz = quizById as QuizWithQuestions | null
        }
    }

    if (!quiz) {
        notFound()
    }

    const questions: Question[] = (quiz.quiz_questions ?? [])
        .slice()
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map((question) => ({
            id: question.id,
            quiz_id: question.quiz_id,
            content: question.content,
            type: question.type,
            explanation: question.explanation ?? undefined,
            media_url: question.media_url ?? undefined,
            media_type: question.media_type ?? undefined,
            order_index: question.order_index,
            answers: (question.quiz_answers ?? [])
                .slice()
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                .map((answer) => ({
                    id: answer.id,
                    question_id: answer.question_id,
                    content: answer.content,
                    is_correct: false,
                    order_index: answer.order_index,
                })),
        }))

    const quizForPlayer: Quiz & { questions: Question[] } = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description ?? undefined,
        is_public: quiz.is_public,
        share_token: quiz.share_token ?? token,
        created_at: quiz.created_at,
        questions,
    }

    return (
        <div className="container max-w-4xl py-10">
            <ToolShell
                title={quizForPlayer.title}
                description={quizForPlayer.description || "Làm bài trắc nghiệm"}
                icon={Play}
            >
                <QuizPlayer quiz={quizForPlayer} revealAnswers={false} accessToken={token} />
            </ToolShell>
        </div>
    )
}
