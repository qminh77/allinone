'use client'

import dynamic from 'next/dynamic'
import type { QuizPlayerProps } from '@/components/quiz/QuizPlayer'

const QuizPlayerAsync = dynamic(
    () => import('@/components/quiz/QuizPlayer').then(module => module.QuizPlayer),
    {
        ssr: false,
        loading: () => <div className="h-[36rem] rounded-lg border bg-muted/20 animate-pulse" />,
    }
)

export function QuizPlayerClient(props: QuizPlayerProps) {
    return <QuizPlayerAsync {...props} />
}
