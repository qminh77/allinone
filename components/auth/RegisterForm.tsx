/**
 * Register Form Component
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import Link from 'next/link'

export function RegisterForm() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // Kiểm tra setting allow_registration
            const supabase = createClient()

            const { data: setting } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'allow_registration')
                .single()

            if (setting && !setting.value?.enabled) {
                setError('Đăng ký tạm thời đóng, vui lòng thử lại sau')
                setLoading(false)
                return
            }

            // Validate password
            if (password.length < 8) {
                setError('Mật khẩu phải có ít nhất 8 ký tự')
                setLoading(false)
                return
            }

            // Đăng ký qua API (để tạo profile và gán role)
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    fullName,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Đã có lỗi xảy ra')
                setLoading(false)
                return
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Đã có lỗi xảy ra')
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <Alert>
                        Đăng ký thành công! Đang chuyển đến trang đăng nhập...
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Đăng ký</CardTitle>
                <CardDescription>Tạo tài khoản mới để sử dụng hệ thống</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            {error}
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="Nguyễn Văn A"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Tối thiểu 8 ký tự"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground">
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
