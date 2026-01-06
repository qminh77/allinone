import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Module } from '@/config/modules'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface ModuleCardProps {
    module: Module
}

export function ModuleCard({ module }: ModuleCardProps) {
    const Icon = module.icon

    return (
        <Link href={module.href} className="group block h-full">
            <Card className="h-full border transition-all hover:border-foreground/20 hover:bg-muted/30">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-colors">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex gap-1">
                            {module.isNew && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                    NEW
                                </Badge>
                            )}
                            {module.isPopular && (
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-orange-500/50 text-orange-600">
                                    HOT
                                </Badge>
                            )}
                        </div>
                    </div>
                    <CardTitle className="mt-4 text-base font-medium group-hover:text-primary transition-colors">
                        {module.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs mt-1">
                        {module.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                        Mở công cụ <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
