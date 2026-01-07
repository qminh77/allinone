'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitQuizAttempt, type Quiz, type Question } from '@/lib/actions/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Image as ImageIcon, Youtube } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from 'next/link'

interface QuizPlayerProps {
    quiz: Quiz & { questions: Question[] }
}

export function QuizPlayer({ quiz }: QuizPlayerProps) {
    const [answers, setAnswers] = useState<Record<string, string[]>>({}) // questionId -> [answerIds]
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{ score: number, total: number, attemptId: string } | null>(null)
    const [showExplanation, setShowExplanation] = useState(false)

    const handleSelect = (questionId: string, answerId: string, type: 'single' | 'multiple') => {
        if (result) return // Disable changes if submitted

        setAnswers(prev => {
            const current = prev[questionId] || []
            if (type === 'single') {
                return { ...prev, [questionId]: [answerId] }
            } else {
                if (current.includes(answerId)) {
                    return { ...prev, [questionId]: current.filter(id => id !== answerId) }
                } else {
                    return { ...prev, [questionId]: [...current, answerId] }
                }
            }
        })
    }

    const handleSubmit = async () => {
        // Validate all answered?
        const answeredCount = Object.keys(answers).length
        if (answeredCount < quiz.questions.length) {
            if (!confirm(`Bạn mới trả lời ${answeredCount}/${quiz.questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài?`)) {
                return
            }
        }

        setIsSubmitting(true)
        try {
            const payload = Object.entries(answers).map(([qId, aIds]) => ({
                questionId: qId,
                answerIds: aIds
            }))

            const res = await submitQuizAttempt(quiz.id, payload)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Đã nộp bài!')
                setResult({
                    score: res.score || 0,
                    total: res.totalQuestions || 0,
                    attemptId: res.attemptId || ''
                })
                setShowExplanation(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Helper to get media embed
    const renderMedia = (q: Question) => {
        if (!q.media_url) return null
        if (q.media_type === 'youtube') {
            // Simple check for youtube embed
            // Usually need to extract ID if it's a full link.
            // Assuming user might paste full link or embed link.
            // Simplified: direct iframe if 'embed', else try to make it work?
            // Let's just use a link for safety/simplicity or basic iframe if embeddable.
            return (
                <div className="my-4 aspect-video rounded-lg overflow-hidden bg-black/5 border">
                    <iframe
                        className="w-full h-full"
                        src={q.media_url.replace("watch?v=", "embed/")}
                        title="YouTube video"
                        allowFullScreen
                    />
                </div>
            )
        }
        return (
            <div className="my-4 rounded-lg overflow-hidden border">
                <img src={q.media_url} alt="Question Media" className="w-full h-auto max-h-[400px] object-contain bg-background" />
            </div>
        )
    }

    if (result) {
        return (
            <div className="space-y-8 animate-in fade-in">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold text-primary">Kết quả: {result.score} / {result.total}</CardTitle>
                        <CardDescription className="text-lg">
                            {result.score === result.total ? 'Xuất sắc! Bạn đã trả lời đúng tất cả.' :
                                result.score >= result.total / 2 ? 'Làm tốt lắm!' : 'Hãy cố gắng hơn lần sau nhé.'}
                        </CardDescription>
                        <div className="flex justify-center gap-4 pt-4">
                            <Button onClick={() => window.location.reload()}>Làm lại</Button>
                            <Link href="/dashboard/quiz/history">
                                <Button variant="outline">Xem lịch sử</Button>
                            </Link>
                        </div>
                    </CardHeader>
                </Card>

                {/* Review Mode */}
                <div className="space-y-8">
                    {quiz.questions.map((q, idx) => {
                        const userSelected = answers[q.id] || []
                        const correctAnswers = q.answers?.filter(a => a.is_correct).map(a => a.id) || []

                        // Determine if question was correct
                        let isCorrect = false
                        if (q.type === 'single') {
                            if (userSelected.length === 1 && correctAnswers.includes(userSelected[0])) isCorrect = true
                        } else {
                            const selectedSet = new Set(userSelected)
                            const correctSet = new Set(correctAnswers)
                            if (selectedSet.size === correctSet.size && [...selectedSet].every(x => correctSet.has(x))) isCorrect = true
                        }

                        return (
                            <Card key={q.id} className={`border-2 ${isCorrect ? 'border-green-500/20' : 'border-red-500/20'}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between">
                                        <Badge variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-green-600 hover:bg-green-700" : ""}>
                                            {isCorrect ? <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Đúng</span> : <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Sai</span>}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">Câu {idx + 1}</span>
                                    </div>
                                    <CardTitle className="text-lg pt-2">{q.content}</CardTitle>
                                    {renderMedia(q)}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        {q.answers?.map(a => {
                                            const isSelected = userSelected.includes(a.id)
                                            const isAnswerCorrect = a.is_correct

                                            let styleClass = "p-3 rounded-lg border flex items-center gap-3 "
                                            if (isAnswerCorrect) {
                                                styleClass += "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100"
                                            } else if (isSelected && !isAnswerCorrect) {
                                                styleClass += "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100"
                                            } else {
                                                styleClass += "opacity-70"
                                            }

                                            return (
                                                <div key={a.id} className={styleClass}>
                                                    {isAnswerCorrect ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : isSelected ? <XCircle className="h-4 w-4 shrink-0" /> : <div className="h-4 w-4" />}
                                                    <span>{a.content}</span>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {q.explanation && (
                                        <Alert variant="default" className="bg-muted text-muted-foreground">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Giải thích</AlertTitle>
                                            <AlertDescription>{q.explanation}</AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            {quiz.questions.map((q, idx) => (
                <Card key={q.id} id={`q-${idx}`}>
                    <CardHeader>
                        <div className="flex justify-between items-center mb-2">
                            <Badge variant="outline">Câu {idx + 1}</Badge>
                            {q.type === 'multiple' && <Badge variant="secondary">Chọn nhiều đáp án</Badge>}
                        </div>
                        <CardTitle className="text-xl font-medium">{q.content}</CardTitle>
                        {renderMedia(q)}
                    </CardHeader>
                    <CardContent>
                        {q.type === 'single' ? (
                            <RadioGroup
                                onValueChange={(val) => handleSelect(q.id, val, 'single')}
                                value={answers[q.id]?.[0]}
                                className="space-y-3"
                            >
                                {q.answers?.map((a) => (
                                    <div key={a.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => handleSelect(q.id, a.id, 'single')}>
                                        <RadioGroupItem value={a.id} id={a.id} />
                                        <Label htmlFor={a.id} className="flex-1 cursor-pointer font-normal">{a.content}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        ) : (
                            <div className="space-y-3">
                                {q.answers?.map((a) => (
                                    <div key={a.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                                        <Checkbox
                                            id={a.id}
                                            checked={answers[q.id]?.includes(a.id)}
                                            onCheckedChange={() => handleSelect(q.id, a.id, 'multiple')}
                                        />
                                        <Label htmlFor={a.id} className="flex-1 cursor-pointer font-normal">{a.content}</Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}

            <div className="flex justify-end pt-4 pb-12">
                <Button size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Nộp bài
                </Button>
            </div>
        </div>
    )
}
