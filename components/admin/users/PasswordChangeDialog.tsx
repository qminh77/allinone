'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { resetPassword, updateUserPassword } from '@/lib/actions/admin/users'
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

        if (!autoGenerate && manualPassword.length < 8) {
            toast.error('Mật khẩu phải có ít nhất 8 ký tự')
            setLoading(false)
            return
        }

        try {
            const result = autoGenerate
                ? await resetPassword(userId)
                : await updateUserPassword(userId, manualPassword)

            if ('error' in result && result.error) {
                toast.error(result.error)
            } else if ('newPassword' in result) {
                setResultPassword(result.newPassword)
                toast.success('Đã đổi mật khẩu thành công')
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể đổi mật khẩu')
        } finally {
            setLoading(false)
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
                                    minLength={8}
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
