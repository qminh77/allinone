'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createSmtpConfig } from '@/lib/actions/mail'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'

export function AccountForm() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const res = await createSmtpConfig(formData)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Đã thêm cấu hình SMTP!')
            setOpen(false)
            e.currentTarget.reset()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Thêm tài khoản</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thêm cấu hình SMTP</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin máy chủ SMTP để gửi mail.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên cấu hình (Ví dụ: Gmail Cá nhân)</Label>
                        <Input id="name" name="name" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="host">SMTP Host</Label>
                            <Input id="host" name="host" defaultValue="smtp.gmail.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="port">Port</Label>
                            <Input id="port" name="port" type="number" defaultValue="587" required />
                        </div>
                    </div>
                    <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <Checkbox id="secure" name="secure" value="true" />
                        <div className="space-y-1 leading-none">
                            <Label htmlFor="secure">
                                Secure (SSL/TLS)
                            </Label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" name="username" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password (App Password)</Label>
                        <Input id="password" name="password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="from_email">From Email</Label>
                        <Input id="from_email" name="from_email" type="email" placeholder="email@example.com" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu cấu hình
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
