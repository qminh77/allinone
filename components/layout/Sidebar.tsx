/**
 * Sidebar Component
 */

'use client'

import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ProtectedFeature } from '@/components/auth/ProtectedFeature'
import { LayoutDashboard, ChevronRight, Command } from 'lucide-react'
import { modules, categories } from '@/config/modules'
import { PermissionKey } from '@/types/permissions'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"

interface SidebarProps {
    enabledModules?: Record<string, boolean>
}

export function SidebarContent({ enabledModules }: { enabledModules?: Record<string, boolean> }) {
    const pathname = usePathname()
    // Default open all categories
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        'General': true,
        'Network': true,
        'Utilities': true
    })

    const toggleCategory = (key: string) => {
        setOpenCategories(prev => ({ ...prev, [key]: !prev[key] }))
    }

    // Filter modules based on enabled status
    const activeModules = modules.filter(m => {
        if (!enabledModules) return true
        return enabledModules[m.key] !== false
    })

    // Group by category
    const modulesByCategory = activeModules.reduce((acc, module) => {
        const cat = module.category || 'Other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(module)
        return acc
    }, {} as Record<string, typeof activeModules>)

    return (
        <div className="flex flex-col h-full bg-sidebar-background border-r">
            <div className="h-16 flex items-center px-6 border-b">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <Command className="h-5 w-5" />
                    </div>
                    <span className="text-lg">Tools Admin</span>
                </Link>
            </div>

            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-4 px-3 py-4">
                        {/* Dashboard/Overview Link */}
                        <Link
                            href="/dashboard"
                            className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                pathname === '/dashboard'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Tổng quan</span>
                        </Link>

                        <Separator />

                        {/* Generic Categories */}
                        {categories.map(cat => {
                            const catModules = modulesByCategory[cat.key]
                            if (!catModules || catModules.length === 0) return null

                            return (
                                <Collapsible
                                    key={cat.key}
                                    open={openCategories[cat.key]}
                                    onOpenChange={() => toggleCategory(cat.key)}
                                    className="space-y-1"
                                >
                                    <CollapsibleTrigger className="flex w-full items-center justify-between py-2 px-3 text-sm font-semibold hover:bg-muted/50 rounded-md transition-colors">
                                        <span className="text-muted-foreground uppercase text-xs tracking-wider">{cat.name}</span>
                                        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200 text-muted-foreground", openCategories[cat.key] && "rotate-90")} />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="space-y-1 pt-1">
                                        {catModules.map((item) => {
                                            const isActive = pathname === item.href
                                            const Icon = item.icon

                                            const linkContent = (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={cn(
                                                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors pl-6', // Indent items
                                                        isActive
                                                            ? 'bg-primary/10 text-primary font-medium'
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
                                    </CollapsibleContent>
                                </Collapsible>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}

export function Sidebar({ enabledModules }: SidebarProps) {
    return (
        <aside className="hidden w-64 flex-col border-r bg-card/50 backdrop-blur-xl md:flex">
            <SidebarContent enabledModules={enabledModules} />
        </aside>
    )
}
