'use client'

import { useState } from 'react'
import { modules, categories, Module, ModuleCategory } from '@/config/modules'
import { ModuleCard } from './ModuleCard'
import { Input } from '@/components/ui/input'
import { Search, LayoutGrid, List } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export function DashboardShell({ enabledModules }: { enabledModules?: Record<string, boolean> }) {
    const [searchQuery, setSearchQuery] = useState('')

    // Filter modules based on search AND enabled status
    const filteredModules = modules.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description.toLowerCase().includes(searchQuery.toLowerCase())
        const isEnabled = enabledModules ? enabledModules[m.key] !== false : true
        return matchesSearch && isEnabled
    })

    // Group by category used in the filtered list
    // If search is active, we might want to just show a flat list or still grouped?
    // Let's stick to grouping for structure unless result count is very low.

    const activeCategories = Array.from(new Set(filteredModules.map(m => m.category)))

    // Sort categories based on predefined order
    const sortedActiveCategories = categories
        .filter(c => activeCategories.includes(c.key))
        .map(c => c.key)

    // If search returns results but some categories are not in our predefined list (edge case), add them
    activeCategories.forEach(c => {
        if (!sortedActiveCategories.includes(c)) sortedActiveCategories.push(c)
    })

    return (
        <div className="space-y-8">
            {/* Search Section */}
            <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm công cụ (VD: json, ảnh, text...)"
                    className="pl-9 bg-background/50 backdrop-blur-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Modules Grid */}
            <div className="space-y-10">
                {filteredModules.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        Không tìm thấy công cụ nào phù hợp với "{searchQuery}"
                    </div>
                ) : (
                    sortedActiveCategories.map(categoryKey => {
                        const categoryName = categories.find(c => c.key === categoryKey)?.name || categoryKey
                        const categoryModules = filteredModules.filter(m => m.category === categoryKey)

                        return (
                            <div key={categoryKey} className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <h3 className="text-lg font-semibold tracking-tight">{categoryName}</h3>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                        {categoryModules.length}
                                    </span>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {categoryModules.map(module => (
                                        <ModuleCard key={module.key} module={module} />
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
