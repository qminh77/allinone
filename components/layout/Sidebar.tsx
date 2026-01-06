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


import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export function SidebarContent({ enabledModules }: { enabledModules?: Record<string, boolean> }) {
    const pathname = usePathname()

    // Filter modules based on enabled status
    const activeModules = modules.filter(m => {
        if (!enabledModules) return true
        return enabledModules[m.key] !== false
    })

    return (
        <div className="flex flex-col h-full bg-card/50">
            <div className="p-6">
                <h2 className="text-lg font-semibold tracking-tight">Discover</h2>
            </div>

            <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-2">
                    <div className="px-3 py-2">
                        <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                            Tổng quan
                        </h2>
                        <div className="space-y-1">
                            <Link
                                href="/dashboard"
                                className={cn(
                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    pathname === '/dashboard'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Tổng quan</span>
                            </Link>
                        </div>
                    </div>

                    <Separator className="mx-3 opacity-50" />

                    <div className="px-3 py-2">
                        <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                            Công cụ
                        </h2>
                        <div className="space-y-1">
                            {activeModules.map((item) => {
                                const isActive = pathname === item.href
                                const Icon = item.icon

                                const linkContent = (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
            </ScrollArea>

            {/* Optional Footer / User Profile Summary if needed in future */}
            <div className="p-4 border-t bg-background/50 backdrop-blur">
                <p className="text-xs text-center text-muted-foreground">Version 1.0.0</p>
            </div>
        </div>
    )
}

export function Sidebar({ enabledModules }: SidebarProps) {
    return (
        <aside className="hidden border-r bg-card/50 backdrop-blur-xl md:flex md:w-64 md:flex-col fixed top-16 bottom-0 z-30">
            <SidebarContent enabledModules={enabledModules} />
        </aside>
    )
}

