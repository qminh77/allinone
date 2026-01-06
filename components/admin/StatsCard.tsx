/**
 * Stats Card Component
 * Displays statistics with icon, title, value, and optional description
 */

import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    className?: string
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    className,
}: StatsCardProps) {
    return (
        <Card className={cn('hover:shadow-md transition-shadow', className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                            {title}
                        </p>
                        <p className="text-3xl font-bold">{value}</p>
                        {description && (
                            <p className="text-xs text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

