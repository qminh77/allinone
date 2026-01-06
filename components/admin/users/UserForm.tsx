'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createUser, updateUser } from '@/lib/actions/admin/users'
import { toast } from 'sonner'
import { Loader2, Copy } from 'lucide-react'

interface Role {
    id: string
    name: string
}

interface User {
    id?: string
    full_name: string
    email?: string
    role_id?: string
    is_active: boolean
}

interface UserFormProps {
    open: boolean
    onClose: () => void
    user?: User | null
    roles: Role[]
}

export function UserForm({ open, onClose, user, roles }: UserFormProps) {
    const [loading, setLoading] = useState(false)
    const [tempPassword, setTempPassword] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setTempPassword(null)

        const formData = new FormData(e.currentTarget)

        let result
        if (user?.id) {
            result = await updateUser(user.id, formData)
        } else {
            result = await createUser(formData)
        }

        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            if ('tempPassword' in result && result.tempPassword) {
                setTempPassword(result.tempPassword)
                toast.success('Đã tạo người dùng thành công!')
            } else {
                toast.success('Đã cập nhật người dùng')
                onClose()
                window.location.reload()
            }
        }
    }

    const copyPassword = () => {
        if (tempPassword) {
            navigator.clipboard.writeText(tempPassword)
            toast.success('Đã copy mật khẩu')
        }
    }

    const handleClose = () => {
        setTempPassword(null)
        onClose()
        if (tempPassword) {
            window.location.reload()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{user?.id ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</DialogTitle>
                    <DialogDescription>
                        {user?.id ? 'Cập nhật thông tin người dùng' : 'Tạo tài khoản mới với mật khẩu tự động'}
                    </DialogDescription>
                </DialogHeader>

                {tempPassword ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <h4 className="font-semibold text-green-900 mb-2">✓ Tạo tài khoản thành công!</h4>
                            <p className="text-sm text-green-800 mb-3">Mật khẩu tạm thời:</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white border border-green-300 rounded px-3 py-2 font-mono text-sm">
                                    {tempPassword}
                                </code>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyPassword}
                                    className="border-green-300"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-green-700 mt-2">
                                Vui lòng lưu lại mật khẩu này. Người dùng nên đổi mật khẩu sau khi đăng nhập lần đầu.
                            </p>
                        </div>
                        <Button onClick={handleClose} className="w-full">Đóng</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!user?.id && (
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="user@example.com"
                                    defaultValue={user?.email}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="full_name">Họ và tên *</Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                required
                                placeholder="Nguyễn Văn A"
                                defaultValue={user?.full_name}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role_id">Vai trò *</Label>
                            <Select name="role_id" defaultValue={user?.role_id} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {user?.id && (
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active">Trạng thái hoạt động</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Vô hiệu hóa sẽ chặn đăng nhập
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    name="is_active"
                                    value="true"
                                    defaultChecked={user?.is_active ?? true}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {user?.id ? 'Cập nhật' : 'Tạo người dùng'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
