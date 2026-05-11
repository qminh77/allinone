import { ToolShell } from '@/components/dashboard/ToolShell'
import { QuizFormClient } from '@/components/quiz/QuizFormClient'
import { PenTool } from 'lucide-react'

export default function CreateQuizPage() {
    return (
        <ToolShell
            title="Tạo bộ câu hỏi mới"
            description="Tạo một bộ câu hỏi trắc nghiệm mới để bạn hoặc người khác có thể luyện tập."
            icon={PenTool}
        >
            <div className="flex justify-center">
                <div className="w-full max-w-3xl">
                    <QuizFormClient />
                </div>
            </div>
        </ToolShell>
    )
}
