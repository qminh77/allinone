'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { categories, getCategoryName, type ModuleCatalogItem } from '@/config/module-metadata'
import { ModuleCard } from './ModuleCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, X } from 'lucide-react'

const DashboardAiCommand = dynamic(
    () => import('@/components/ai/DashboardAiCommand').then(module => module.DashboardAiCommand),
    {
        ssr: false,
        loading: () => null,
    }
)

const ALL_CATEGORIES = 'all'
const DEFAULT_CATEGORY_LIMIT = 12

export function DashboardShell({ modules }: { modules: ModuleCatalogItem[] }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

    const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery])
    const activeModules = useMemo(
        () => modules.filter(moduleItem => moduleItem.isEnabled !== false),
        [modules]
    )
    const categoryItems = useMemo(() => {
        const knownCategoryKeys = new Set(categories.map(category => category.key as string))
        const extraCategories = Array.from(new Set(activeModules.map(moduleItem => moduleItem.category)))
            .filter(categoryKey => !knownCategoryKeys.has(categoryKey))
            .map(categoryKey => ({ key: categoryKey, name: categoryKey }))

        return [...categories, ...extraCategories]
    }, [activeModules])
    const categorySummaries = useMemo(() => {
        const counts = new Map<string, number>()
        activeModules.forEach(moduleItem => {
            counts.set(moduleItem.category, (counts.get(moduleItem.category) || 0) + 1)
        })

        return categoryItems
            .map(category => ({
                ...category,
                count: counts.get(category.key) || 0,
            }))
            .filter(category => category.count > 0)
    }, [activeModules, categoryItems])

    const filteredModules = useMemo(() => {
        return activeModules.filter(moduleItem => {
            const matchesSearch = !normalizedSearchQuery
                || moduleItem.name.toLowerCase().includes(normalizedSearchQuery)
                || moduleItem.description.toLowerCase().includes(normalizedSearchQuery)
            const matchesCategory = selectedCategory === ALL_CATEGORIES || moduleItem.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [activeModules, normalizedSearchQuery, selectedCategory])

    const categoryModulesMap = useMemo(() => {
        return filteredModules.reduce((acc, moduleItem) => {
            const categoryModules = acc.get(moduleItem.category) || []
            categoryModules.push(moduleItem)
            acc.set(moduleItem.category, categoryModules)
            return acc
        }, new Map<string, ModuleCatalogItem[]>())
    }, [filteredModules])

    const sortedActiveCategories = useMemo(() => {
        const ordered = categoryItems
            .filter(category => categoryModulesMap.has(category.key))
            .map(category => category.key as string)

        categoryModulesMap.forEach((_, categoryKey) => {
            if (!ordered.includes(categoryKey)) {
                ordered.push(categoryKey)
            }
        })

        return ordered
    }, [categoryItems, categoryModulesMap])

    const clearSearch = () => {
        setSearchQuery('')
    }

    return (
        <div className="space-y-5">
            <DashboardAiCommand />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm công cụ, định dạng hoặc tác vụ..."
                        className="h-10 bg-background pl-9 pr-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={clearSearch}
                        >
                            <X className="size-4" />
                            <span className="sr-only">Xóa tìm kiếm</span>
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="h-8 px-3">
                        {filteredModules.length} / {activeModules.length} công cụ
                    </Badge>
                </div>
            </div>

            <div className="md:hidden">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Chọn nhóm công cụ" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value={ALL_CATEGORIES}>Tất cả ({activeModules.length})</SelectItem>
                        {categorySummaries.map(category => (
                            <SelectItem key={category.key} value={category.key}>
                                {category.name} ({category.count})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="hidden overflow-x-auto pb-1 md:block">
                <TabsList className="w-max justify-start gap-1 rounded-lg bg-muted/60">
                    <TabsTrigger value={ALL_CATEGORIES} className="flex-none">
                        Tất cả
                        <span className="text-xs text-muted-foreground">{activeModules.length}</span>
                    </TabsTrigger>
                    {categorySummaries.map(category => (
                        <TabsTrigger key={category.key} value={category.key} className="flex-none">
                            {category.name}
                            <span className="text-xs text-muted-foreground">{category.count}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="space-y-6">
                {filteredModules.length === 0 ? (
                    <div className="rounded-lg border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
                        Không tìm thấy công cụ phù hợp với &quot;{searchQuery}&quot;.
                    </div>
                ) : (
                    sortedActiveCategories.map(categoryKey => {
                        const categoryName = getCategoryName(categoryKey)
                        const categoryModules = categoryModulesMap.get(categoryKey) || []
                        const isExpanded = expandedCategories[categoryKey]
                        const visibleModules = isExpanded
                            ? categoryModules
                            : categoryModules.slice(0, DEFAULT_CATEGORY_LIMIT)
                        const hiddenCount = categoryModules.length - visibleModules.length

                        return (
                            <section key={categoryKey} className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-sm font-semibold">{categoryName}</h2>
                                    </div>
                                    <Badge variant="outline" className="shrink-0">
                                        {categoryModules.length}
                                    </Badge>
                                </div>

                                <div className="grid gap-1 rounded-lg border bg-card p-1 sm:grid-cols-2 xl:grid-cols-3">
                                    {visibleModules.map(module => (
                                        <ModuleCard key={module.key} module={module} />
                                    ))}
                                </div>

                                {hiddenCount > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setExpandedCategories(prev => ({ ...prev, [categoryKey]: true }))}
                                    >
                                        Hiển thị thêm {hiddenCount} công cụ
                                    </Button>
                                )}
                            </section>
                        )
                    })
                )}
            </div>
        </div>
    )
}
