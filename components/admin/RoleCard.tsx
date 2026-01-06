/**
 * Role Card Component
 * Displays role information in a modern card layout
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Users, Lock, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoleCardProps {
    role: {
        id: string
        name: string
        description?: string
        is_system: boolean
        permissionCount?: number
        userCount?: number
    }
    onEdit?: () => void
    onDelete?: () => void
}

export function RoleCard({ role, onEdit, onDelete }: RoleCardProps) {
    return (
        <Card className="group hover:shadow-md hover:border-foreground/20 transition-all duration-200">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-muted">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {role.name}
                                {role.is_system && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Lock className="h-3 w-3 mr-1" />
                                        System
                                    </Badge>
                                )}
                            </CardTitle>
                        </div>
                    </div>
                </div>
                <CardDescription className="mt-2">
                    {role.description || 'No description'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Lock className="h-4 w-4" />
                            <span>{role.permissionCount || 0} permissions</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{role.userCount || 0} users</span>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onEdit}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {onDelete && !role.is_system && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onDelete}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

