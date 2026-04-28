'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getModuleIcon, type ModuleCatalogItem } from '@/config/modules'
import { ModuleToggle } from '@/components/admin/ModuleToggle'
import { ChevronDown, Search } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface ModuleListProps {
    modules: ModuleCatalogItem[]
    initialStatuses: Record<string, boolean>
}

export function ModuleList({ modules, initialStatuses }: ModuleListProps) {
    const [visibleCount, setVisibleCount] = useState(30)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('all')
    const [statuses, setStatuses] = useState(initialStatuses)

    const categories = useMemo(() => {
        return Array.from(new Set(modules.map((moduleItem) => moduleItem.category))).sort()
    }, [modules])

    const filteredModules = useMemo(() => {
        const query = search.trim().toLowerCase()

        return modules.filter((moduleItem) => {
            const matchesCategory = category === 'all' || moduleItem.category === category
            const matchesSearch = !query ||
                moduleItem.name.toLowerCase().includes(query) ||
                moduleItem.key.toLowerCase().includes(query) ||
                moduleItem.description.toLowerCase().includes(query)

            return matchesCategory && matchesSearch
        })
    }, [category, modules, search])

    const visibleModules = filteredModules.slice(0, visibleCount)
    const hasMore = visibleCount < filteredModules.length
    const enabledCount = modules.filter((moduleItem) => statuses[moduleItem.key] ?? moduleItem.isEnabled).length

    const handleShowMore = () => {
        setVisibleCount((prev) => Math.min(prev + 50, filteredModules.length))
    }

    const handleCategoryChange = (nextCategory: string) => {
        setCategory(nextCategory)
        setVisibleCount(30)
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value)
                            setVisibleCount(30)
                        }}
                        placeholder="Tìm module theo tên, key hoặc mô tả..."
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <span className="font-medium">{enabledCount}</span>
                    <span className="text-muted-foreground">/{modules.length} modules đang bật</span>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto">
                <Button
                    type="button"
                    variant={category === 'all' ? 'default' : 'outline'}
                    onClick={() => handleCategoryChange('all')}
                >
                    Tất cả
                </Button>
                {categories.map((categoryItem) => (
                    <Button
                        key={categoryItem}
                        type="button"
                        variant={category === categoryItem ? 'default' : 'outline'}
                        onClick={() => handleCategoryChange(categoryItem)}
                    >
                        {categoryItem}
                    </Button>
                ))}
            </div>

            <div className="overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Module</TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleModules.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Không tìm thấy module
                                </TableCell>
                            </TableRow>
                        )}
                        {visibleModules.map((moduleItem) => {
                            const Icon = getModuleIcon(moduleItem)

                            return (
                            <TableRow key={moduleItem.key}>
                                <TableCell>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 grid size-9 place-items-center rounded-md bg-muted">
                                            <Icon className="size-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{moduleItem.name}</p>
                                            <p className="max-w-2xl text-sm text-muted-foreground">{moduleItem.description}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {moduleItem.key}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{moduleItem.category}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {moduleItem.isNew && <Badge variant="secondary">New</Badge>}
                                        {moduleItem.isPopular && <Badge variant="secondary">Popular</Badge>}
                                        {!moduleItem.isNew && !moduleItem.isPopular && (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <ModuleToggle
                                        moduleKey={moduleItem.key}
                                        initialEnabled={statuses[moduleItem.key] ?? moduleItem.isEnabled}
                                        onChange={(enabled) => {
                                            setStatuses((current) => ({
                                                ...current,
                                                [moduleItem.key]: enabled,
                                            }))
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm text-muted-foreground sm:flex-row">
                <span>
                    Hiển thị {visibleModules.length}/{filteredModules.length} modules sau lọc.
                </span>
                {hasMore && (
                    <Button variant="outline" onClick={handleShowMore} className="gap-2">
                        Hiển thị thêm {Math.min(50, filteredModules.length - visibleCount)}
                        <ChevronDown className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
