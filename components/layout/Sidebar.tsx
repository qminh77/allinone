/**
 * Sidebar Component
 */

'use client'

import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ProtectedFeature } from '@/components/auth/ProtectedFeature'
import { LayoutDashboard } from 'lucide-react'
import { modules } from '@/config/modules'
import { PermissionKey } from '@/types/permissions'

interface SidebarProps {
    enabledModules?: Record<string, boolean>
}

export function Sidebar({ enabledModules }: SidebarProps) {
    const pathname = usePathname()

    // Filter modules based on enabled status
    // If enabledModules is provided, use it. If not (first load or server error), default to Showing All or Hiding?
    // Better to default to showing if undefined, but admin logic says default enabled.
    const activeModules = modules.filter(m => {
        if (!enabledModules) return true
        return enabledModules[m.key] !== false // Default to true if undefined
    })

    return (
        <aside className="w-64 border-r bg-card/50 backdrop-blur-xl">
            <div className="space-y-6 p-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                        Tổng quan
                    </h2>
                    <div className="space-y-1">
                        <Link
                            href="/dashboard"
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                                pathname === '/dashboard'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted'
                            )}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Tổng quan</span>
                        </Link>
                    </div>
                </div>

                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                        Công cụ
                    </h2>
                    <div className="space-y-1">
                        {activeModules.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon

                            // Only show if not a future placeholder without real link? 
                            // For now assume all valid.

                            const linkContent = (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-muted'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                </Link>
                            )

                            if (item.permission) {
                                return (
                                    <ProtectedFeature key={item.href} permission={item.permission as PermissionKey}>
                                        {linkContent}
                                    </ProtectedFeature>
                                )
                            }

                            return linkContent
                        })}
                    </div>
                </div>
            </div>
        </aside>
    )
}
