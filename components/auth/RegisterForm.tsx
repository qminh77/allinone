"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, UserRound } from "lucide-react"

export function RegisterForm() {
    const router = useRouter()
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự")
            setLoading(false)
            return
        }

        try {
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
                setError(data.error || "Đã có lỗi xảy ra")
                setLoading(false)
                return
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full border shadow-sm">
                <CardHeader className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="size-5" />
                        <CardTitle className="text-xl">Đăng ký thành công</CardTitle>
                    </div>
                    <CardDescription>
                        Đang chuyển hướng đến trang đăng nhập...
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="w-full border shadow-sm">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-semibold tracking-tight">Tạo tài khoản</CardTitle>
                <CardDescription>
                    Hoàn tất thông tin để tạo tài khoản mới.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="size-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <div className="relative">
                            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="fullName"
                                placeholder="Nguyễn Văn A"
                                autoComplete="name"
                                className="pl-9"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

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
                                placeholder="Tối thiểu 8 ký tự"
                                autoComplete="new-password"
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
                        <p className="text-xs text-muted-foreground">Mật khẩu cần có ít nhất 8 ký tự.</p>
                    </div>

                    <Button className="w-full" type="submit" disabled={loading}>
                        {loading && <Loader2 className="size-4 animate-spin" />}
                        {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
                    </Button>
                </CardContent>
                <CardFooter className="mt-6 justify-center border-t bg-muted/30 px-6 py-4">
                    <div className="text-center text-sm text-muted-foreground">
                        Đã có tài khoản?{" "}
                        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                            Đăng nhập
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
