'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createQuiz, updateQuiz, type Quiz } from '@/lib/actions/quiz'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const quizSchema = z.object({
    title: z.string().min(3, 'Tên bộ câu hỏi phải có ít nhất 3 ký tự'),
    description: z.string().optional(),
    is_public: z.boolean(),
})

type QuizFormValues = z.infer<typeof quizSchema>

interface QuizFormProps {
    quiz?: Quiz
    isEditing?: boolean
}

export function QuizForm({ quiz, isEditing = false }: QuizFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm({
        resolver: zodResolver(quizSchema),
        defaultValues: {
            title: quiz?.title || '',
            description: quiz?.description || '',
            is_public: quiz?.is_public || false,
        },
    })

    async function onSubmit(data: QuizFormValues) {
        setIsLoading(true)
        try {
            if (isEditing && quiz) {
                const res = await updateQuiz(quiz.id, data)
                if (res.error) {
                    toast.error(res.error)
                } else {
                    toast.success('Cập nhật bộ câu hỏi thành công')
                    router.push('/dashboard/quiz/my-quizzes')
                }
            } else {
                const res = await createQuiz(data.title, data.description || '', data.is_public)
                if (res.error) {
                    toast.error(res.error)
                } else {
                    toast.success('Tạo bộ câu hỏi thành công')
                    // Redirect to edit page to add questions immediately? or list?
                    // Usually users want to add questions right away.
                    if (res.data) {
                        router.push(`/dashboard/quiz/${res.data.id}/edit`)
                    } else {
                        router.push('/dashboard/quiz/my-quizzes')
                    }
                }
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-card p-6 rounded-lg border shadow-sm">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên bộ câu hỏi</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập tên..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả (Tùy chọn)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Nhập mô tả..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Công khai (Public)</FormLabel>
                                <FormDescription>
                                    Cho phép người khác tìm thấy và làm bài trắc nghiệm này mà không cần share token (nếu có tính năng tìm kiếm).
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                        Hủy
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Lưu thay đổi' : 'Tạo mới'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
