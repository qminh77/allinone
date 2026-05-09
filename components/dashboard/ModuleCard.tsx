import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getModuleIcon, type ModuleCatalogItem } from '@/config/module-metadata'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { memo } from 'react'

interface ModuleCardProps {
    module: ModuleCatalogItem
}

function renderModuleIcon(module: ModuleCatalogItem) {
    const Icon = getModuleIcon(module)

    return (
        <Icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
    )
}

export const ModuleCard = memo(function ModuleCard({ module }: ModuleCardProps) {
    return (
        <Button
            asChild
            variant="ghost"
            className="group h-auto w-full justify-start whitespace-normal rounded-lg border border-transparent px-3 py-2.5 text-left hover:border-border hover:bg-accent"
        >
            <Link href={module.href} prefetch={false}>
                {renderModuleIcon(module)}
                <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium leading-none">{module.name}</span>
                        {module.isPopular && (
                            <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px]">
                                HOT
                            </Badge>
                        )}
                        {module.isNew && !module.isPopular && (
                            <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px]">
                                NEW
                            </Badge>
                        )}
                    </span>
                    <span className="line-clamp-1 text-xs font-normal leading-5 text-muted-foreground">
                        {module.description}
                    </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
        </Button>
    )
})
