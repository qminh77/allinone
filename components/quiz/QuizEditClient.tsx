'use client'

import dynamic from 'next/dynamic'
import type { QuizEditContentProps } from '@/components/quiz/QuizEditContent'

const QuizEditContent = dynamic(
    () => import('@/components/quiz/QuizEditContent').then(module => module.QuizEditContent),
    {
        ssr: false,
        loading: () => <div className="h-[36rem] rounded-lg border bg-muted/20 animate-pulse" />,
    }
)

export function QuizEditClient(props: QuizEditContentProps) {
    return <QuizEditContent {...props} />
}
