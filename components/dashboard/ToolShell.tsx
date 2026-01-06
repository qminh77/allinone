import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolShellProps {
    title: string
    description: string
    icon: LucideIcon
    children: React.ReactNode
    className?: string
}

export function ToolShell({
    title,
    description,
    icon: Icon,
    children,
    className
}: ToolShellProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Standard Header */}
            <div className="space-y-4">
                {/* Breadcrumb / Nav */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-medium">Tools</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground">{title}</span>
                </div>

                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Icon className="h-6 w-6 text-primary" />
                            </div>
                            {title}
                        </h1>
                        <p className="text-muted-foreground max-w-2xl text-lg">
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className={cn("max-w-full", className)}>
                {children}
            </div>
        </div>
    )
}
