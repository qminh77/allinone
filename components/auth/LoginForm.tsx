"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

// Simple Icons component if not exists, or replace with lucide-react in code
// For cleanliness, I will stick to Lucide icons imported directly where needed, 
// but define a logical structure.

export function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const supabase = createClient()

            // Authenticate
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                setError("Email hoặc mật khẩu không chính xác")
                setLoading(false)
                return
            }

            // Audit log & Sync Profile
            try {
                // Sync profile first (in case it's missing)
                await fetch('/api/auth/sync-profile', {
                    method: 'POST',
                })

                // Then audit log
                await fetch('/api/audit/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'login',
                        userId: data.user?.id,
                    }),
                })
            } catch (ignore) { }

            router.push('/dashboard')
            router.refresh()
        } catch (err: any) {
            setError(err.message || "Đã có lỗi xảy ra")
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-sm shadow-lg border-muted/40">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-center">Đăng nhập</CardTitle>
                <CardDescription className="text-center">
                    Nhập email của bạn để truy cập hệ thống
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="grid gap-4">
                    {error && (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
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
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                        Chưa có tài khoản?{" "}
                        <Link href="/register" className="text-primary underline-offset-4 hover:underline font-medium">
                            Đăng ký ngay
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
