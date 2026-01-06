"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2 } from "lucide-react"

export function RegisterForm() {
    const router = useRouter()
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
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
        } catch (err: any) {
            setError(err.message || "Đã có lỗi xảy ra")
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-sm shadow-lg border-muted/40">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-center text-xl">Đăng ký thành công!</CardTitle>
                    <CardDescription className="text-center">
                        Đang chuyển hướng đến trang đăng nhập...
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-sm shadow-lg border-muted/40">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-center">Tạo tài khoản</CardTitle>
                <CardDescription className="text-center">
                    Nhập thông tin bên dưới để đăng ký tài khoản mới
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
                <CardContent className="grid gap-4">
                    {error && (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input
                            id="fullName"
                            placeholder="Nguyễn Văn A"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="grid gap-2">
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
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                        Đã có tài khoản?{" "}
                        <Link href="/login" className="text-primary underline-offset-4 hover:underline font-medium">
                            Đăng nhập
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
