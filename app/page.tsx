import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Shield, Lock, Zap } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="flex h-16 items-center justify-between border-b px-6 lg:px-10">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Shield className="h-5 w-5" />
                    </div>
                    Tool Website
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost">Đăng nhập</Button>
                    </Link>
                    <Link href="/register">
                        <Button>Đăng ký</Button>
                    </Link>
                </div>
            </header>
            <main className="flex-1">
                <section className="container mx-auto grid items-center gap-10 py-20 lg:grid-cols-2 lg:px-10">
                    <div className="space-y-6">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                            Quản lý công cụ <br />
                            <span className="text-primary">Hiệu quả & Bảo mật</span>
                        </h1>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                            Hệ thống tools được tích hợp trong một nền tảng duy nhất.
                            Phân quyền động, bảo mật cao và dễ dàng quản lý.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/register">
                                <Button size="lg" className="gap-2">
                                    Bắt đầu ngay <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button size="lg" variant="outline">
                                    Đăng nhập
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-2 rounded-xl border p-6 shadow-sm">
                                <Lock className="h-8 w-8 text-primary" />
                                <h3 className="font-semibold">Bảo mật</h3>
                                <p className="text-sm text-muted-foreground">Xác thực 2 lớp và mã hóa dữ liệu đầu cuối.</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl border p-6 shadow-sm">
                                <Zap className="h-8 w-8 text-primary" />
                                <h3 className="font-semibold">Tốc độ</h3>
                                <p className="text-sm text-muted-foreground">Tối ưu hóa hiệu năng cho trải nghiệm mượt mà.</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl border p-6 shadow-sm col-span-2">
                                <Shield className="h-8 w-8 text-primary" />
                                <h3 className="font-semibold">Phân quyền động</h3>
                                <p className="text-sm text-muted-foreground">Quản lý quyền truy cập chi tiết đến từng tính năng.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="border-t py-6">
                <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 md:flex-row lg:px-10">
                    <p className="text-sm text-muted-foreground">
                        © 2024 Tool Website. All rights reserved.
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <Link href="#" className="hover:underline">Điều khoản</Link>
                        <Link href="#" className="hover:underline">Bảo mật</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
