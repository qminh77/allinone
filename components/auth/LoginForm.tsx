/**
 * Login Form Component
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

export function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // Kiểm tra setting allow_login
            const supabase = createClient()

            const { data: setting } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'allow_login')
                .single()

            if (setting && !setting.value?.enabled) {
                setError('Hệ thống đang bảo trì, vui lòng thử lại sau')
                setLoading(false)
                return
            }

            // Đăng nhập
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                setError(signInError.message)
                setLoading(false)
                return
            }

            // Ghi audit log (gọi API)
            await fetch('/api/audit/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    userId: data.user?.id,
                }),
            })

            router.push('/dashboard')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Đã có lỗi xảy ra')
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Đăng nhập</CardTitle>
                <CardDescription>Nhập email và mật khẩu để tiếp tục</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            {error}
                        </Alert>
                    )}

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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground">
                        Chưa có tài khoản?{' '}
                        <Link href="/register" className="text-primary hover:underline">
                            Đăng ký ngay
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
