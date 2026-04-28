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
        <div className="space-y-5 animate-in fade-in duration-500 sm:space-y-6">
            <div className="space-y-3">
                <div className="flex max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
                    <Link href="/dashboard" className="flex items-center gap-1 transition-colors hover:text-foreground">
                        <Home className="size-3" />
                        Dashboard
                    </Link>
                    <ChevronRight className="size-3" />
                    <span className="font-medium text-foreground">Tools</span>
                    <ChevronRight className="size-3" />
                    <span className="text-foreground">{title}</span>
                </div>

                <div className="flex items-start justify-between">
                    <div className="min-w-0 space-y-2">
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                            <Icon className="size-5 shrink-0 text-muted-foreground sm:size-6" />
                            {title}
                        </h1>
                        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            <div className={cn("max-w-full", className)}>
                {children}
            </div>
        </div>
    )
}
