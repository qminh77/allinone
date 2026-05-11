'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Activity,
    BrainCircuit,
    Database,
    Home,
    Key,
    LayoutDashboard,
    LogOut,
    Settings,
    Shield,
    Users,
    Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
    { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Người dùng', icon: Users },
    { href: '/admin/roles', label: 'Vai trò', icon: Shield },
    { href: '/admin/permissions', label: 'Quyền hạn', icon: Key },
    { href: '/admin/modules', label: 'Modules', icon: Wrench },
    { href: '/admin/ai', label: 'AI Center', icon: BrainCircuit },
    { href: '/admin/settings', label: 'Cấu hình', icon: Settings },
    { href: '/admin/logs', label: 'Audit logs', icon: Activity },
    { href: '/admin/backup', label: 'Backups', icon: Database },
]

interface AdminNavigationProps {
    userName: string
    userEmail?: string
}

export function AdminNavigation({ userName, userEmail }: AdminNavigationProps) {
    const pathname = usePathname()

    return (
        <aside className="border-b bg-background lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
            <div className="flex h-full flex-col">
                <div className="border-b px-5 py-5">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
                            <Shield className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold">AdminCP</p>
                            <p className="truncate text-xs text-muted-foreground">Quản trị hệ thống</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:overflow-visible">
                    {navItems.map((item) => {
                        const active = item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(item.href)
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors lg:min-w-0',
                                    active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <Icon className="size-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="hidden border-t p-4 lg:block">
                    <div className="mb-3 rounded-md bg-muted/60 p-3">
                        <p className="truncate text-sm font-medium">{userName}</p>
                        {userEmail && (
                            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Link
                            href="/dashboard"
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent"
                        >
                            <Home className="size-4" />
                            Dashboard
                        </Link>
                        <form action="/api/auth/logout" method="post">
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-9 w-full"
                            >
                                <LogOut className="size-4" />
                                Đăng xuất
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </aside>
    )
}
