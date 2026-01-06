'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { sendMailAction } from '@/lib/actions/mail'
import { toast } from 'sonner'
import TinyEditor from './TinyEditor'
import { Loader2, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const formSchema = z.object({
    config_id: z.string().min(1, 'Vui lòng chọn tài khoản gửi'),
    to: z.string().min(1, 'Người nhận là bắt buộc'),
    subject: z.string().min(1, 'Tiêu đề là bắt buộc'),
    body: z.string().min(1, 'Nội dung là bắt buộc'),
})

interface SmtpConfig {
    id: string
    name: string
    from_email: string
}

export function SendMailForm({ configs }: { configs: SmtpConfig[] }) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            config_id: '',
            to: '',
            subject: '',
            body: ''
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        const formData = new FormData()
        Object.entries(values).forEach(([key, value]) => {
            formData.append(key, String(value))
        })

        const res = await sendMailAction(formData)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Gửi mail thành công!')
            form.reset({
                config_id: values.config_id, // keep the config
                to: '',
                subject: '',
                body: ''
            })
        }
    }

    if (configs.length === 0) {
        return (
            <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                    Bạn chưa có cấu hình tài khoản gửi mail nào. Vui lòng thêm tài khoản trước.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Soạn Mail</CardTitle>
                <CardDescription>Gửi mail đến một hoặc nhiều người nhận (phân cách bằng dấu phẩy).</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="config_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gửi từ</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn tài khoản" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {configs.map((config) => (
                                                    <SelectItem key={config.id} value={config.id}>
                                                        {config.name} ({config.from_email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="to"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Người nhận (To)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="email1@example.com, email2@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tiêu đề</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập tiêu đề mail..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="body"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nội dung</FormLabel>
                                    <FormControl>
                                        <TinyEditor value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading} size="lg">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Gửi Mail
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
