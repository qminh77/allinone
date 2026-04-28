import { LayoutGrid } from "lucide-react"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_480px]">
                <aside className="hidden border-r bg-muted/30 p-8 lg:flex lg:flex-col lg:justify-between">
                    <div className="flex items-center gap-2 font-semibold">
                        <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                            <LayoutGrid className="size-4" />
                        </div>
                        <span>Tools Admin</span>
                    </div>
                    <div className="max-w-md space-y-3">
                        <h1 className="text-2xl font-semibold tracking-tight">Quản trị công cụ tập trung</h1>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Đăng nhập để tiếp tục sử dụng dashboard và các công cụ nội bộ.
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground">Allinone</p>
                </aside>

                <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:min-h-0">
                    <div className="w-full max-w-md">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
