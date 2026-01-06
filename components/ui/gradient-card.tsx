/**
 * Enhanced Card Component
 * Card with subtle border for premium look
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface EnhancedCardProps {
    title?: string
    description?: string
    children: ReactNode
    className?: string
}

export function EnhancedCard({
    title,
    description,
    children,
    className,
}: EnhancedCardProps) {
    return (
        <Card className={cn('border-2 hover:shadow-lg transition-all', className)}>
            {(title || description) && (
                <CardHeader>
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent className={!title && !description ? 'p-6' : ''}>
                {children}
            </CardContent>
        </Card>
    )
}

