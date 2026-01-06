/**
 * Admin Layout
 */

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/permissions/check'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Users, Shield, Wrench, Settings, FileText, Database, Key } from 'lucide-react'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const isAdmin = await hasRole(user.id, 'Admin')

    if (!isAdmin) {
        redirect('/dashboard')
    }

    const navItems = [
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/roles', label: 'Roles', icon: Shield },
        { href: '/admin/permissions', label: 'Permissions', icon: Key },
        { href: '/admin/modules', label: 'Modules', icon: Wrench },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
        { href: '/admin/logs', label: 'Audit Logs', icon: FileText },
        { href: '/admin/backup', label: 'Backups', icon: Database },
    ]

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-muted/10">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold">Admin Panel</h1>
                    <p className="text-sm text-muted-foreground mt-1">System Management</p>
                </div>
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                    <div className="pt-4 mt-4 border-t">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                        >
                            <Home className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    )
}
