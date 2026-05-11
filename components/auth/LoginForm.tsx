"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"

export function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Email hoặc mật khẩu không chính xác")
                setLoading(false)
                return
            }

            // Audit log & Sync Profile
            try {
                await Promise.all([
                    fetch('/api/auth/sync-profile', {
                        method: 'POST',
                    }),
                    fetch('/api/audit/log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'login',
                            userId: data.userId,
                        }),
                    }),
                ])
            } catch { }

            router.push('/dashboard')
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
            setLoading(false)
        }
    }

    return (
        <Card className="w-full border shadow-sm">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-semibold tracking-tight">Đăng nhập</CardTitle>
                <CardDescription>
                    Nhập thông tin tài khoản để tiếp tục.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="size-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                autoComplete="email"
                                className="pl-9"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                className="pl-9 pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2"
                                onClick={() => setShowPassword(value => !value)}
                                disabled={loading}
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                <span className="sr-only">{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</span>
                            </Button>
                        </div>
                    </div>

                    <Button className="w-full" type="submit" disabled={loading}>
                        {loading && <Loader2 className="size-4 animate-spin" />}
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </Button>
                </CardContent>
                <CardFooter className="mt-6 justify-center border-t bg-muted/30 px-6 py-4">
                    <div className="text-center text-sm text-muted-foreground">
                        Chưa có tài khoản?{" "}
                        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                            Đăng ký ngay
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
