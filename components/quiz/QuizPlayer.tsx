'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitQuizAttempt, type Quiz, type Question, type Answer } from '@/lib/actions/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Clock, Shuffle, Settings2, ChevronRight, ChevronLeft, Eye, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface QuizPlayerProps {
    quiz: Quiz & { questions: Question[] }
}

interface QuizConfig {
    mode: 'exam' | 'practice'
    timeLimit: number // in minutes, 0 = unlimited
    shuffle: boolean
    questionCount: number
    viewMode: 'single' | 'list'
}

type QuizStatus = 'setup' | 'playing' | 'finished'

export function QuizPlayer({ quiz }: QuizPlayerProps) {
    // --- State: Config & Flow ---
    const [status, setStatus] = useState<QuizStatus>('setup')
    const [config, setConfig] = useState<QuizConfig>({
        mode: 'exam',
        timeLimit: 30,
        shuffle: false,
        questionCount: quiz.questions.length,
        viewMode: 'single'
    })

    // --- State: Gameplay ---
    const [questions, setQuestions] = useState<Question[]>([])
    const [answers, setAnswers] = useState<Record<string, string[]>>({})
    const [timeLeft, setTimeLeft] = useState(0) // in seconds
    const [currentQIndex, setCurrentQIndex] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{ score: number, total: number, attemptId: string } | null>(null)
    const [practiceChecks, setPracticeChecks] = useState<Record<string, boolean>>({}) // questionId -> isChecked

    // --- State: UI ---
    const [confirmOpen, setConfirmOpen] = useState(false)

    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // --- Helpers ---
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // --- Setup Phase ---
    const handleStart = () => {
        let qList = [...quiz.questions]

        // 1. Shuffle
        if (config.shuffle) {
            qList = qList.sort(() => Math.random() - 0.5)
        }

        // 2. Limit count
        if (config.questionCount > 0 && config.questionCount < qList.length) {
            qList = qList.slice(0, config.questionCount)
        }

        // 3. Shuffle Answers (locally modify question object structure for display? No, better handle in render or shallow copy)
        // We need to persist shuffled answer order.
        if (config.shuffle) {
            qList = qList.map(q => ({
                ...q,
                answers: q.answers ? [...q.answers].sort(() => Math.random() - 0.5) : []
            }))
        }

        setQuestions(qList)
        setQuestions(qList)
        setTimeLeft(config.timeLimit * 60)
        setAnswers({})
        setPracticeChecks({})
        setCurrentQIndex(0)
        setStatus('playing')
    }

    // --- Timer Effect ---
    useEffect(() => {
        if (status === 'playing' && config.mode === 'exam' && config.timeLimit > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!)
                        handleSubmit(true) // Helper to auto submit
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [status, config.mode, config.timeLimit])

    // --- Interaction ---
    const handleSelect = (questionId: string, answerId: string, type: 'single' | 'multiple') => {
        if (status !== 'playing') return
        if (config.mode === 'practice' && practiceChecks[questionId]) return // Locked after check

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

    const handlePracticeCheck = (qId: string) => {
        setPracticeChecks(prev => ({ ...prev, [qId]: true }))
    }

    const handleSubmit = async (auto = false) => {
        if (!auto) {
            setConfirmOpen(true)
            return
        }
        performSubmit(true)
    }

    const performSubmit = async (auto = false) => {
        setIsSubmitting(true)
        if (timerRef.current) clearInterval(timerRef.current)

        try {
            const payload = Object.entries(answers).map(([qId, aIds]) => ({
                questionId: qId,
                answerIds: aIds
            }))

            const res = await submitQuizAttempt(quiz.id, payload)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(auto ? 'Hết giờ! Đã tự động nộp bài.' : 'Đã nộp bài!')
                setResult({
                    score: res.score || 0,
                    total: res.totalQuestions || 0,
                    attemptId: res.attemptId || ''
                })
                setStatus('finished')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setIsSubmitting(false)
            setConfirmOpen(false)
        }
    }

    // --- Render Helpers ---
    const renderMedia = (q: Question) => {
        if (!q.media_url) return null
        if (q.media_type === 'youtube') {
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
            <div className="my-4 rounded-lg overflow-hidden border bg-muted/20">
                <img src={q.media_url} alt="Question Media" className="w-full h-auto max-h-[400px] object-contain mx-auto" />
            </div>
        )
    }

    const renderQuestionCard = (q: Question, index: number, isReview = false) => {
        const userSelected = answers[q.id] || []
        const isChecked = config.mode === 'practice' && practiceChecks[q.id]

        const showFeedback = isReview || isChecked

        const correctAnswers = q.answers?.filter(a => a.is_correct).map(a => a.id) || []
        const isCorrect = userSelected.length > 0 &&
            (q.type === 'single'
                ? correctAnswers.includes(userSelected[0])
                : (userSelected.length === correctAnswers.length && userSelected.every(id => correctAnswers.includes(id))))

        return (
            <Card key={q.id} className={`w-full ${showFeedback ? (isCorrect ? 'border-green-500/30' : 'border-red-500/30') : ''}`}>
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">Câu {index + 1}</Badge>
                                {q.type === 'multiple' && <Badge variant="secondary" className="text-xs">Chọn nhiều</Badge>}
                                {showFeedback && (
                                    <Badge variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-green-600" : ""}>
                                        {isCorrect ? "Đúng" : "Sai"}
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-lg font-medium leading-relaxed">{q.content}</CardTitle>
                        </div>
                    </div>
                    {renderMedia(q)}
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {q.answers?.map((a) => {
                            const isSelected = userSelected.includes(a.id)
                            const isAnswerCorrect = a.is_correct

                            let className = "flex items-center space-x-3 p-3 rounded-lg border transition-colors relative overflow-hidden "
                            if (showFeedback) {
                                if (isAnswerCorrect) {
                                    className += "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800"
                                } else if (isSelected) {
                                    className += "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800"
                                } else {
                                    className += "opacity-60"
                                }
                            } else {
                                className += "hover:bg-muted/50 cursor-pointer"
                                if (isSelected) className += " border-primary bg-primary/5 ring-1 ring-primary/20"
                            }

                            return (
                                <div
                                    key={a.id}
                                    className={className}
                                    onClick={() => !showFeedback && handleSelect(q.id, a.id, q.type)}
                                >
                                    {q.type === 'single' ? (
                                        <div className={`h-4 w-4 rounded-full border border-primary flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary' : ''}`}>
                                            {isSelected && <div className="h-2 w-2 rounded-full bg-background" />}
                                        </div>
                                    ) : (
                                        <div className={`h-4 w-4 rounded border border-primary flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}>
                                            {isSelected && <CheckCircle2 className="h-3 w-3" />}
                                        </div>
                                    )}
                                    <span className="flex-1 font-normal">{a.content}</span>
                                    {showFeedback && (
                                        <>
                                            {isAnswerCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                            {isSelected && !isAnswerCorrect && <XCircle className="h-4 w-4 text-red-600" />}
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {showFeedback && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            {q.explanation && (
                                <Alert variant="default" className="bg-muted text-muted-foreground border-none">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Giải thích</AlertTitle>
                                    <AlertDescription className="mt-1">{q.explanation}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-between border-t p-4 bg-muted/5">
                    {config.mode === 'practice' && !showFeedback && !isReview && (
                        <Button variant="secondary" size="sm" onClick={() => handlePracticeCheck(q.id)} disabled={userSelected.length === 0}>
                            <Eye className="mr-2 h-4 w-4" /> Kiểm tra đáp án
                        </Button>
                    )}
                </CardFooter>
            </Card>
        )
    }

    // --- VIEW: Setup ---
    if (status === 'setup') {
        return (
            <Card className="max-w-2xl mx-auto border-2">
                <CardHeader>
                    <CardTitle className="text-2xl">Cấu hình bài thi</CardTitle>
                    <CardDescription>Tùy chỉnh chế độ làm bài phù hợp với nhu cầu của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs defaultValue="exam" onValueChange={(v) => setConfig({ ...config, mode: v as 'exam' | 'practice' })}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="exam">Chế độ Thi</TabsTrigger>
                            <TabsTrigger value="practice">Chế độ Luyện tập</TabsTrigger>
                        </TabsList>

                        <div className="mt-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className="flex flex-col gap-1">
                                    <span className="font-semibold">Số lượng câu hỏi</span>
                                    <span className="text-xs text-muted-foreground">Tối đa: {quiz.questions.length} câu</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={quiz.questions.length}
                                        value={config.questionCount}
                                        onChange={(e) => setConfig({ ...config, questionCount: Math.min(Math.max(1, parseInt(e.target.value) || 1), quiz.questions.length) })}
                                        className="w-20 text-right"
                                    />
                                    <span className="text-sm text-muted-foreground">câu</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label className="flex flex-col gap-1">
                                    <span className="font-semibold">Xáo trộn câu hỏi</span>
                                    <span className="text-xs text-muted-foreground">Đảo ngẫu nhiên thứ tự câu hỏi và đáp án</span>
                                </Label>
                                <Switch checked={config.shuffle} onCheckedChange={(c) => setConfig({ ...config, shuffle: c })} />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label className="flex flex-col gap-1">
                                    <span className="font-semibold">Chế độ hiển thị</span>
                                    <span className="text-xs text-muted-foreground">Hiển thị từng câu hoặc toàn bộ</span>
                                </Label>
                                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                                    <Button
                                        variant={config.viewMode === 'single' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setConfig({ ...config, viewMode: 'single' })}
                                        className="h-7 text-xs"
                                    >
                                        Từng câu
                                    </Button>
                                    <Button
                                        variant={config.viewMode === 'list' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setConfig({ ...config, viewMode: 'list' })}
                                        className="h-7 text-xs"
                                    >
                                        Danh sách
                                    </Button>
                                </div>
                            </div>

                            <TabsContent value="exam" className="space-y-6 mt-0">
                                <div className="flex items-center justify-between">
                                    <Label className="flex flex-col gap-1">
                                        <span className="font-semibold">Thời gian làm bài</span>
                                        <span className="text-xs text-muted-foreground">Tính bằng phút (0 = không giới hạn)</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            value={config.timeLimit}
                                            onChange={(e) => setConfig({ ...config, timeLimit: parseInt(e.target.value) || 0 })}
                                            className="w-20 text-right"
                                        />
                                        <span className="text-sm text-muted-foreground">phút</span>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="practice" className="mt-0">
                                <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm border border-blue-100 flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5" />
                                    <div>Trong chế độ luyện tập, bạn có thể kiểm tra đáp án và xem giải thích ngay sau mỗi câu hỏi.</div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" size="lg" onClick={handleStart}>Bắt đầu làm bài</Button>
                </CardFooter>
            </Card>
        )
    }

    // --- VIEW: Finished (Result) ---
    if (status === 'finished' && result) {
        return (
            <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
                <Card className="bg-background border-2 border-primary/20 shadow-lg">
                    <CardHeader className="text-center py-10">
                        <CardTitle className="text-4xl font-bold text-primary mb-2">
                            {result.score} / {questions.length}
                            <span className="text-lg text-muted-foreground font-normal ml-2">({Math.round(result.score / questions.length * 100)}%)</span>
                        </CardTitle>
                        <CardDescription className="text-xl">
                            {result.score === questions.length ? 'Xuất sắc! Tuyệt đối hoàn hảo.' :
                                result.score >= questions.length / 2 ? 'Kết quả tốt!' : 'Cần cố gắng hơn.'}
                        </CardDescription>

                        <div className="flex justify-center gap-4 pt-8">
                            <Button onClick={() => { setStatus('setup') }}>Làm lại đề này</Button>
                            <Link href="/dashboard/quiz/history">
                                <Button variant="outline">Xem lịch sử</Button>
                            </Link>
                        </div>
                    </CardHeader>
                </Card>

                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-xl font-semibold">Xem lại bài làm</h3>
                </div>

                <div className="space-y-6">
                    {questions.map((q, idx) => renderQuestionCard(q, idx, true))}
                </div>
            </div>
        )
    }

    // --- VIEW: Playing ---
    const currentQ = questions[currentQIndex]
    const progress = ((currentQIndex + 1) / questions.length) * 100

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header / Top Bar */}
            <div className="sticky top-4 z-10 bg-background/80 backdrop-blur-md border rounded-lg p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="h-8 px-3 gap-2 text-sm">
                        <Settings2 className="h-3 w-3" />
                        {config.mode === 'exam' ? 'Chế độ Thi' : 'Luyện tập'}
                    </Badge>
                    {config.mode === 'exam' && config.timeLimit > 0 && (
                        <Badge variant={timeLeft < 60 ? "destructive" : "secondary"} className="h-8 px-3 gap-2 text-sm font-mono text-base">
                            <Clock className="h-4 w-4" />
                            {formatTime(timeLeft)}
                        </Badge>
                    )}
                </div>

                <Button size="sm" onClick={() => handleSubmit()} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Nộp bài
                </Button>
            </div>

            {/* List View */}
            {config.viewMode === 'list' && (
                <div className="space-y-6">
                    {questions.map((q, idx) => renderQuestionCard(q, idx))}
                </div>
            )}

            {/* Single View */}
            {config.viewMode === 'single' && currentQ && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Câu {currentQIndex + 1}/{questions.length}</span>
                        <Progress value={progress} className="h-2" />
                    </div>

                    <div className="min-h-[400px]">
                        {renderQuestionCard(currentQ, currentQIndex)}
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
                            disabled={currentQIndex === 0}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" /> Trước
                        </Button>


                        <Button
                            onClick={() => {
                                if (currentQIndex < questions.length - 1) {
                                    setCurrentQIndex(currentQIndex + 1)
                                }
                            }}
                            disabled={currentQIndex === questions.length - 1}
                            className={currentQIndex === questions.length - 1 ? "invisible" : ""}
                        >
                            Sau <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>

                        {currentQIndex === questions.length - 1 && (
                            <Button onClick={() => handleSubmit()} variant="default">
                                Nộp bài <Send className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Nộp bài thi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {Object.keys(answers).length < questions.length
                                ? `Bạn mới trả lời ${Object.keys(answers).length}/${questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài?`
                                : "Bạn đã hoàn thành tất cả câu hỏi. Bạn có chắc chắn muốn nộp bài?"
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => performSubmit(false)}>Nộp bài</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
