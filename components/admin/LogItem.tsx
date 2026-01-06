/**
 * Log Item Component
 * Timeline-style audit log item display
 */

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
    LogIn,
    LogOut,
    UserPlus,
    Settings,
    Shield,
    Trash2,
    Edit,
    Lock,
    Activity
} from 'lucide-react'

interface LogItemProps {
    log: {
        id: string
        action: string
        resource_type: string | null
        metadata: any
        ip_address: string | null
        user_agent: string | null
        created_at: string
        user_id: string | null
    }
}

const actionIcons: Record<string, any> = {
    login: LogIn,
    logout: LogOut,
    register: UserPlus,
    'role.update': Shield,
    'role.create': Shield,
    'role.delete': Trash2,
    'module.enable': Settings,
    'module.disable': Settings,
    'settings.update': Settings,
    'permission.update': Lock,
}

export function LogItem({ log }: LogItemProps) {
    const Icon = actionIcons[log.action] || Activity

    return (
        <div className="relative pl-8 pb-8 last:pb-0">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-border" />

            {/* Icon */}
            <div className="absolute left-0 top-1 p-1.5 rounded-full bg-foreground">
                <Icon className="h-3 w-3 text-background" />
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <Badge variant="outline" className="mb-1">
                                {log.action}
                            </Badge>
                            {log.resource_type && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                    {log.resource_type}
                                </span>
                            )}
                        </div>
                        <time className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('vi-VN')}
                        </time>
                    </div>

                    {log.metadata && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                            <pre className="overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                        </div>
                    )}

                    {log.ip_address && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            IP: {log.ip_address}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
