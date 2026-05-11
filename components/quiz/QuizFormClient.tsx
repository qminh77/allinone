'use client'

import dynamic from 'next/dynamic'

const QuizForm = dynamic(
    () => import('@/components/quiz/QuizForm').then(module => module.QuizForm),
    {
        ssr: false,
        loading: () => <div className="h-96 rounded-lg border bg-muted/20 animate-pulse" />,
    }
)

export function QuizFormClient() {
    return <QuizForm />
}
