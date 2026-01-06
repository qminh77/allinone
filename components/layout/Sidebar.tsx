/**
 * Sidebar Component
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ProtectedFeature } from '@/components/auth/ProtectedFeature'

interface SidebarItem {
    name: string
    href: string
    icon?: string
    permission?: any
}

const sidebarItems: SidebarItem[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: '🏠',
    },
    {
        name: 'Text Formatter',
        href: '/tools/text-formatter',
        icon: '📝',
        permission: 'tools.textformatter.access',
    },
    {
        name: 'Image Compressor',
        href: '/tools/image-compressor',
        icon: '🖼️',
        permission: 'tools.imagecompressor.access',
    },
    {
        name: 'JSON Validator',
        href: '/tools/json-validator',
        icon: '📋',
        permission: 'tools.jsonvalidator.access',
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 border-r bg-muted/10">
            <div className="space-y-1 p-4">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href

                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                            )}
                        >
                            {item.icon && <span className="text-lg">{item.icon}</span>}
                            <span>{item.name}</span>
                        </Link>
                    )

                    if (item.permission) {
                        return (
                            <ProtectedFeature key={item.href} permission={item.permission}>
                                {linkContent}
                            </ProtectedFeature>
                        )
                    }

                    return linkContent
                })}
            </div>
        </aside>
    )
}
