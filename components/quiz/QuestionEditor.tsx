'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, X } from 'lucide-react'
import { createQuestion, updateQuestion, type Question } from '@/lib/actions/quiz'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'

// Zod Schema
const answerSchema = z.object({
    content: z.string().min(1, "Nội dung đáp án không được để trống"),
    is_correct: z.boolean(),
})

const questionSchema = z.object({
    content: z.string().min(3, "Nội dung câu hỏi quá ngắn"),
    type: z.enum(['single', 'multiple']),
    explanation: z.string().optional(),
    media_url: z.string().optional(), // Check URL valid? simplified for now
    media_type: z.enum(['image', 'youtube']).optional(),
    answers: z.array(answerSchema).min(2, "Phải có ít nhất 2 đáp án"),
})

type QuestionFormValues = z.infer<typeof questionSchema>

interface QuestionEditorProps {
    quizId: string
    question?: Question
    onSuccess: () => void
    onCancel: () => void
}

export function QuestionEditor({ quizId, question, onSuccess, onCancel }: QuestionEditorProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<QuestionFormValues>({
        resolver: zodResolver(questionSchema),
        defaultValues: {
            content: question?.content || '',
            type: (question?.type as 'single' | 'multiple') || 'single',
            explanation: question?.explanation || '',
            media_url: question?.media_url || '',
            media_type: (question?.media_type as 'image' | 'youtube') || 'image',
            answers: question?.answers?.map(a => ({ content: a.content, is_correct: a.is_correct })) || [
                { content: '', is_correct: false },
                { content: '', is_correct: false }
            ],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "answers",
    })

    const watchType = form.watch("type")

    async function onSubmit(data: QuestionFormValues) {
        // Validate at least one correct answer
        const hasCorrect = data.answers.some(a => a.is_correct)
        if (!hasCorrect) {
            form.setError('root', { message: 'Phải chọn ít nhất 1 đáp án đúng' })
            return
        }

        if (data.type === 'single') {
            const correctCount = data.answers.filter(a => a.is_correct).length
            if (correctCount > 1) {
                form.setError('root', { message: 'Câu hỏi 1 đáp án đúng chỉ được chọn 1 đáp án đúng' })
                return
            }
        }

        setIsLoading(true)
        try {
            if (question) {
                const res = await updateQuestion(question.id, {
                    content: data.content,
                    type: data.type,
                    explanation: data.explanation,
                    media_url: data.media_url,
                    media_type: data.media_type,
                }, data.answers)

                if (res.error) {
                    toast.error(res.error)
                } else {
                    toast.success('Đã cập nhật câu hỏi')
                    onSuccess()
                }
            } else {
                const res = await createQuestion(quizId, {
                    content: data.content,
                    type: data.type,
                    explanation: data.explanation,
                    media_url: data.media_url,
                    media_type: data.media_type,
                    order_index: 0 // handled by DB or ignored for now?
                }, data.answers)

                if (res.error) {
                    toast.error(res.error)
                } else {
                    toast.success('Đã thêm câu hỏi')
                    onSuccess()
                }
            }
        } catch {
            toast.error('Có lỗi xảy ra')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nội dung câu hỏi</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Nhập câu hỏi..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại câu hỏi</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn loại" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="single">Một đáp án đúng</SelectItem>
                                                <SelectItem value="multiple">Nhiều đáp án đúng</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Answers Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <FormLabel>Danh sách đáp án</FormLabel>
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ content: '', is_correct: false })}>
                                    <Plus className="h-4 w-4 mr-1" /> Thêm đáp án
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-3">
                                    <div className="pt-3">
                                        {watchType === 'single' ? (
                                            <Checkbox
                                                checked={form.watch(`answers.${index}.is_correct`)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        fields.forEach((_, i) => {
                                                            if (i !== index) form.setValue(`answers.${i}.is_correct`, false)
                                                        })
                                                        form.setValue(`answers.${index}.is_correct`, true)
                                                    } else {
                                                        form.setValue(`answers.${index}.is_correct`, false)
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name={`answers.${index}.is_correct`}
                                                render={({ field }) => (
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                )}
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <FormField
                                            control={form.control}
                                            name={`answers.${index}.content`}
                                            render={({ field }) => (
                                                <Input placeholder={`Đáp án ${index + 1}`} {...field} />
                                            )}
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <FormMessage>{form.formState.errors.answers?.message}</FormMessage>
                            {form.formState.errors.root && <div className="text-destructive text-sm font-medium">{form.formState.errors.root.message}</div>}
                        </div>

                        {/* Explanation & Media */}
                        <div className="space-y-4 pt-4 border-t">
                            <FormField
                                control={form.control}
                                name="explanation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giải thích đáp án (Hiện sau khi trả lời)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Giải thích tại sao..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="media_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loại Media</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn loại" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="image">Hình ảnh (URL)</SelectItem>
                                                    <SelectItem value="youtube">YouTube (URL)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="media_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Link Media</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                                Hủy bỏ
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {question ? 'Cập nhật' : 'Thêm câu hỏi'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
