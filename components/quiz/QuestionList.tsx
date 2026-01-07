'use client'

import { useState } from 'react'
import { Question, deleteQuestion } from '@/lib/actions/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Edit, Trash2, GripVertical, Plus } from 'lucide-react'
import { QuestionEditor } from './QuestionEditor'
import { ImportQuestionsDialog } from './ImportQuestionsDialog'
// DeleteQuestionButton doesn't exist yet, avoiding import error. Inline delete logic used previously.
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface QuestionListProps {
    quizId: string
    questions: Question[]
}

export function QuestionList({ quizId, questions }: QuestionListProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return
        const res = await deleteQuestion(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Đã xóa câu hỏi')
            router.refresh()
        }
    }

    if (isCreating) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Thêm câu hỏi mới</h3>
                </div>
                <QuestionEditor
                    quizId={quizId}
                    onSuccess={() => { setIsCreating(false); router.refresh() }}
                    onCancel={() => setIsCreating(false)}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Danh sách câu hỏi ({questions.length})</h3>
                <div className="flex gap-2">
                    <ImportQuestionsDialog quizId={quizId} />
                    <Button size="sm" onClick={() => setIsCreating(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm câu hỏi
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        Chưa có câu hỏi nào.
                    </div>
                )}

                {questions.map((q, idx) => (
                    <div key={q.id}>
                        {editingId === q.id ? (
                            <QuestionEditor
                                quizId={quizId}
                                question={q}
                                onSuccess={() => { setEditingId(null); router.refresh() }}
                                onCancel={() => setEditingId(null)}
                            />
                        ) : (
                            <Card className="group relative hover:border-primary/50 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-2 pt-1 text-muted-foreground">
                                            <GripVertical className="h-5 w-5 cursor-move" />
                                            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-1 rounded">Q{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Badge variant="outline" className="mb-2 uppercase text-[10px] tracking-wider">
                                                        {q.type === 'single' ? 'Một đáp án' : 'Multi-choice'}
                                                    </Badge>
                                                    <p className="font-medium whitespace-pre-wrap">{q.content}</p>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingId(q.id)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(q.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Preview Answers */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-3 pl-2 border-l-2 bg-muted/20 p-2 rounded-r">
                                                {q.answers?.map((a, i) => (
                                                    <div key={a.id} className={`flex items-center gap-2 ${a.is_correct ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                                        {a.is_correct ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 border rounded-full border-muted-foreground/30" />}
                                                        <span>{a.content}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
