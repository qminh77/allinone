'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    createFlashcardSet,
    updateFlashcardSet,
    type FlashcardSetSummary,
} from '@/lib/actions/flashcards'

const setSchema = z.object({
    title: z.string().trim().min(3, 'Tiêu đề phải có ít nhất 3 ký tự').max(160, 'Tiêu đề tối đa 160 ký tự'),
    description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự').optional(),
    visibility: z.enum(['public', 'private']),
})

type SetFormValues = z.infer<typeof setSchema>

interface FlashcardSetFormProps {
    set?: FlashcardSetSummary
    isEditing?: boolean
}

export function FlashcardSetForm({ set, isEditing = false }: FlashcardSetFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<SetFormValues>({
        resolver: zodResolver(setSchema),
        defaultValues: {
            title: set?.title || '',
            description: set?.description || '',
            visibility: set?.visibility || 'private',
        },
    })

    async function onSubmit(values: SetFormValues) {
        setIsLoading(true)
        try {
            if (isEditing && set) {
                const result = await updateFlashcardSet(set.id, values)
                if (result.error) {
                    toast.error(result.error)
                    return
                }

                toast.success('Đã cập nhật flashcard set')
                router.push('/dashboard/flashcards/library')
                router.refresh()
                return
            }

            const result = await createFlashcardSet(values)
            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success('Đã tạo flashcard set')
            if (result.data?.id) {
                router.push(`/dashboard/flashcards/${result.data.id}/edit`)
            } else {
                router.push('/dashboard/flashcards/library')
            }
        } catch {
            toast.error('Đã xảy ra lỗi')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tiêu đề</FormLabel>
                            <FormControl>
                                <Input placeholder="Ví dụ: English Vocabulary A1" {...field} />
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
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ghi chú ngắn về nội dung set..." rows={4} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Public</FormLabel>
                                <FormDescription>
                                    Public cho phép set xuất hiện trong tìm kiếm. Private chỉ truy cập qua owner hoặc token.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value === 'public'}
                                    onCheckedChange={(checked) => field.onChange(checked ? 'public' : 'private')}
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
                        {isLoading && <Loader2 className="size-4 animate-spin" />}
                        {isEditing ? 'Lưu thay đổi' : 'Tạo set'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
