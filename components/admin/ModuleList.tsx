'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Module } from '@/config/modules'
import { ModuleToggle } from '@/components/admin/ModuleToggle'
import { ChevronDown } from 'lucide-react'

interface ModuleListProps {
    modules: Module[]
    initialStatuses: Record<string, boolean>
}

export function ModuleList({ modules, initialStatuses }: ModuleListProps) {
    const [visibleCount, setVisibleCount] = useState(20)

    const visibleModules = modules.slice(0, visibleCount)
    const hasMore = visibleCount < modules.length

    const handleShowMore = () => {
        setVisibleCount((prev) => Math.min(prev + 50, modules.length))
    }

    return (
        <div className="rounded-md border">
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    <tr className="border-b">
                        <th className="h-10 px-4 text-left align-middle font-medium">Module Name</th>
                        <th className="h-10 px-4 text-left align-middle font-medium">Key</th>
                        <th className="h-10 px-4 text-left align-middle font-medium">Category</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">Status (On/Off)</th>
                    </tr>
                </thead>
                <tbody>
                    {visibleModules.map((m) => (
                        <tr key={m.key} className="border-b hover:bg-muted/50 last:border-0">
                            <td className="p-4 align-middle font-medium flex items-center gap-2">
                                <m.icon className="h-4 w-4 text-muted-foreground" />
                                {m.name}
                            </td>
                            <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                                {m.key}
                            </td>
                            <td className="p-4 align-middle">
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    {m.category}
                                </span>
                            </td>
                            <td className="p-4 align-middle text-right">
                                <ModuleToggle
                                    moduleKey={m.key}
                                    initialEnabled={initialStatuses[m.key] ?? true}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {hasMore && (
                <div className="flex justify-center p-4 border-t bg-muted/20">
                    <Button variant="outline" onClick={handleShowMore} className="gap-2">
                        <span>Hiển thị thêm {Math.min(50, modules.length - visibleCount)} modules</span>
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="flex justify-center p-2 text-xs text-muted-foreground border-t">
                Showing {visibleModules.length} of {modules.length} modules
            </div>
        </div>
    )
}
