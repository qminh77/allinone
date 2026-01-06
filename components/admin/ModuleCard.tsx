/**
 * Module Card Component
 * Displays tool module information with enable/disable toggle
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ModuleCardProps {
    module: {
        id: string
        key: string
        name: string
        description?: string
        icon?: string
        is_enabled: boolean
        sort_order: number
    }
    onToggle?: (enabled: boolean) => void
}

export function ModuleCard({ module, onToggle }: ModuleCardProps) {
    return (
        <Card className={cn(
            'hover:shadow-md transition-all duration-200',
            !module.is_enabled && 'opacity-60'
        )}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'text-3xl w-12 h-12 rounded-lg flex items-center justify-center',
                            module.is_enabled
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                        )}>
                            {module.icon || '🔧'}
                        </div>
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                                {module.name}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs font-mono">
                                {module.key}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={module.is_enabled ? 'default' : 'secondary'}>
                            {module.is_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Switch
                            checked={module.is_enabled}
                            onCheckedChange={onToggle}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {module.description || 'No description available'}
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                    Sort order: {module.sort_order}
                </div>
            </CardContent>
        </Card>
    )
}

