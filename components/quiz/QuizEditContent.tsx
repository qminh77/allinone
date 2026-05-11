'use client'

import type { ComponentProps } from 'react'
import { Separator } from '@/components/ui/separator'
import { QuizForm } from '@/components/quiz/QuizForm'
import { QuestionList } from '@/components/quiz/QuestionList'

type Quiz = NonNullable<ComponentProps<typeof QuizForm>['quiz']>
type QuestionListProps = ComponentProps<typeof QuestionList>

export interface QuizEditContentProps {
    quiz: Quiz & { questions?: QuestionListProps['questions'] }
}

export function QuizEditContent({ quiz }: QuizEditContentProps) {
    return (
        <div className="grid gap-8 max-w-7xl xl:grid-cols-3">
            <div className="xl:col-span-1 space-y-6">
                <div>
                    <h3 className="mb-4 text-lg font-semibold">Thông tin chung</h3>
                    <QuizForm quiz={quiz} isEditing />
                </div>
            </div>

            <div className="xl:col-span-2 space-y-6">
                <Separator className="xl:hidden" />
                <QuestionList quizId={quiz.id} questions={quiz.questions || []} />
            </div>
        </div>
    )
}
