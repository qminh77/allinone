import { redirect } from 'next/navigation'

export default function QuizRedirectPage() {
    redirect('/dashboard/quiz/my-quizzes')
}
