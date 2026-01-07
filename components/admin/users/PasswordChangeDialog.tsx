'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { updateUserPassword } from '@/lib/actions/admin/users'
import { toast } from 'sonner'
import { Loader2, Copy, RefreshCw } from 'lucide-react'

interface PasswordChangeDialogProps {
    open: boolean
    onClose: () => void
    userId: string
    userName: string
}

export function PasswordChangeDialog({ open, onClose, userId, userName }: PasswordChangeDialogProps) {
    const [loading, setLoading] = useState(false)
    const [autoGenerate, setAutoGenerate] = useState(true)
    const [manualPassword, setManualPassword] = useState('')
    const [resultPassword, setResultPassword] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setResultPassword(null)

        let passwordToSet = manualPassword
        if (autoGenerate) {
            passwordToSet = generatePassword()
        }

        if (!autoGenerate && passwordToSet.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự')
            setLoading(false)
            return
        }

        const result = await updateUserPassword(userId, passwordToSet)

        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            setResultPassword(result.newPassword!)
            toast.success('Đã đổi mật khẩu thành công')
        }
    }

    const copyPassword = () => {
        if (resultPassword) {
            navigator.clipboard.writeText(resultPassword)
            toast.success('Đã copy mật khẩu')
        }
    }

    const handleClose = () => {
        setResultPassword(null)
        setManualPassword('')
        setAutoGenerate(true)
        onClose()
    }

    // Helper to generate password client-side if needed for visual, 
    // but actual action uses logic passed or server generated. 
    // Here we generate on client to send to server if manual, 
    // or just let server handle it? 
    // The action `updateUserPassword` takes a password string.
    // So if auto-generate is selected, we should generate it here or let server doing it.
    // My action `resetPassword` calls `generatePassword` on server.
    // My action `updateUserPassword` just updates what is passed.
    // So I should generate it here if auto-generate is selected?
    // actually `resetPassword` implementation I changed earlier calls `updateUserPassword` with a generated password.

    // Let's implement generation here for consistency and immediate feedback before sending?
    // Or simpler: If auto-generate, I create a random string here.
    function generatePassword(length: number = 12): string {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
        let password = ''
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length))
        }
        return password
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Đổi mật khẩu</DialogTitle>
                    <DialogDescription>
                        Thay đổi mật khẩu cho người dùng <strong>{userName}</strong>
                    </DialogDescription>
                </DialogHeader>

                {resultPassword ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <h4 className="font-semibold text-green-900 mb-2">✓ Đổi mật khẩu thành công!</h4>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white border border-green-300 rounded px-3 py-2 font-mono text-sm break-all">
                                    {resultPassword}
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
                        </div>
                        <Button onClick={handleClose} className="w-full">Đóng</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="auto-gen" className="cursor-pointer">Tự động tạo mật khẩu</Label>
                            <Switch
                                id="auto-gen"
                                checked={autoGenerate}
                                onCheckedChange={setAutoGenerate}
                            />
                        </div>

                        {!autoGenerate && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Mật khẩu mới</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    value={manualPassword}
                                    onChange={(e) => setManualPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới..."
                                    required
                                    minLength={6}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Đổi mật khẩu
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
