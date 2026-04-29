/**
 * Sidebar Component
 */

'use client'

import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ProtectedFeature } from '@/components/auth/ProtectedFeature'
import {
    ChevronRight,
    GripVertical,
    History,
    LayoutDashboard,
    Link as LinkIcon,
    Mail,
    PanelLeftClose,
    PanelLeftOpen,
    PenTool,
    Send,
    Settings2,
    FileText,
    ListFilter,
    BookOpen,
    Layers,
} from 'lucide-react'
import { categories, getModuleIcon, type ModuleCatalogItem } from '@/config/module-metadata'
import { PermissionKey } from '@/types/permissions'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"

interface SidebarProps {
    modules: ModuleCatalogItem[]
}

interface SidebarContentProps {
    modules: ModuleCatalogItem[]
    collapsed?: boolean
    onToggleCollapsed?: () => void
}

const SIDEBAR_WIDTH_KEY = 'allinone-sidebar-width'
const SIDEBAR_COLLAPSED_KEY = 'allinone-sidebar-collapsed'
const SIDEBAR_MIN_WIDTH = 220
const SIDEBAR_MAX_WIDTH = 360
const SIDEBAR_COLLAPSED_WIDTH = 60
const SIDEBAR_DEFAULT_WIDTH = 256
const FEATURE_MODULE_KEYS = new Set(['shortlinks', 'mail-system', 'quiz-system', 'flashcard-system'])

function clampSidebarWidth(width: number) {
    return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width))
}

export function SidebarContent({ modules, collapsed = false, onToggleCollapsed }: SidebarContentProps) {
    const pathname = usePathname()
    // Default open all categories
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        'AI': true,
        'Automation': true,
        'General': true,
        'Network': true,
        'Utilities': true,
        'MailSystem': true,
        'QuizSystem': true,
        'FlashcardSystem': true
    })

    const toggleCategory = (key: string) => {
        setOpenCategories(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const isFeatureEnabled = (key: string) => {
        const moduleItem = modules.find(item => item.key === key)
        return moduleItem ? moduleItem.isEnabled !== false : true
    }

    const showShortlinks = isFeatureEnabled('shortlinks')
    const showMail = isFeatureEnabled('mail-system')
    const showQuiz = isFeatureEnabled('quiz-system')
    const showFlashcards = isFeatureEnabled('flashcard-system')

    const activeModules = modules.filter(m => m.isEnabled !== false && !FEATURE_MODULE_KEYS.has(m.key))

    // Group by category
    const modulesByCategory = activeModules.reduce((acc, moduleItem) => {
        const cat = moduleItem.category || 'Other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(moduleItem)
        return acc
    }, {} as Record<string, ModuleCatalogItem[]>)

    const categoryItems = [
        ...categories,
        ...Array.from(new Set(activeModules.map(moduleItem => moduleItem.category)))
            .filter(categoryKey => !categories.some(category => category.key === categoryKey))
            .map(categoryKey => ({ key: categoryKey, name: categoryKey })),
    ]

    const withTooltip = (content: ReactNode, label: string, key?: string) => {
        if (!collapsed) return content

        return (
            <Tooltip key={key}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
        )
    }

    const itemClassName = (active: boolean, inset = false) => cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        inset && !collapsed && 'pl-10',
        collapsed && 'justify-center px-2',
        active
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex h-full flex-col border-r bg-sidebar text-sidebar-foreground">
                <div className="flex h-14 items-center justify-between gap-2 border-b px-3">
                    {!collapsed && (
                        <Link
                            href="/dashboard"
                            prefetch={false}
                            className="flex min-w-0 items-center gap-2 font-semibold"
                        >
                            <LayoutDashboard className="size-4 shrink-0" />
                            <span className="truncate text-base">Tools Admin</span>
                        </Link>
                    )}
                    {onToggleCollapsed && !collapsed && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0"
                            onClick={onToggleCollapsed}
                        >
                            <PanelLeftClose className="size-4" />
                            <span className="sr-only">Thu gọn sidebar</span>
                        </Button>
                    )}
                    {onToggleCollapsed && collapsed && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="mx-auto shrink-0"
                            onClick={onToggleCollapsed}
                        >
                            <PanelLeftOpen className="size-4" />
                            <span className="sr-only">Mở rộng sidebar</span>
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="space-y-3 px-2 py-3">
                            {withTooltip(
                                <Link
                                    href="/dashboard"
                                    prefetch={false}
                                    className={itemClassName(pathname === '/dashboard')}
                                >
                                    <LayoutDashboard className="size-4 shrink-0" />
                                    <span className={cn("truncate", collapsed && "sr-only")}>Tổng quan</span>
                                </Link>,
                                'Tổng quan'
                            )}

                            {showShortlinks && withTooltip(
                                    <Link
                                        href="/dashboard/shortlinks"
                                        prefetch={false}
                                        className={itemClassName(pathname.startsWith('/dashboard/shortlinks'))}
                                    >
                                        <LinkIcon className="size-4 shrink-0" />
                                        <span className={cn("truncate", collapsed && "sr-only")}>Shortlinks</span>
                                    </Link>,
                                    'Shortlinks'
                                )}

                            {showMail && (
                                <Collapsible
                                open={openCategories['MailSystem']}
                                onOpenChange={() => toggleCategory('MailSystem')}
                                className="space-y-1"
                                >
                                    {withTooltip(
                                        <CollapsibleTrigger className={cn(
                                            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted/50",
                                            collapsed && "justify-center px-2"
                                        )}>
                                            <div className="flex min-w-0 items-center gap-3">
                                                <Mail className="size-4 shrink-0" />
                                                <span className={cn("truncate", collapsed && "sr-only")}>Mail System</span>
                                            </div>
                                            <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", openCategories['MailSystem'] && "rotate-90", collapsed && "hidden")} />
                                        </CollapsibleTrigger>,
                                        'Mail System'
                                    )}
                                    <CollapsibleContent className="space-y-1 pt-1">
                                        {withTooltip(
                                            <Link
                                                href="/dashboard/mail/send"
                                                prefetch={false}
                                                className={itemClassName(pathname === '/dashboard/mail/send', true)}
                                            >
                                                <Send className="size-4 shrink-0" />
                                                <span className={cn("truncate", collapsed && "sr-only")}>Gửi Mail</span>
                                            </Link>,
                                            'Gửi Mail'
                                        )}
                                        {withTooltip(
                                            <Link
                                                href="/dashboard/mail/accounts"
                                                prefetch={false}
                                                className={itemClassName(pathname === '/dashboard/mail/accounts', true)}
                                            >
                                                <Settings2 className="size-4 shrink-0" />
                                                <span className={cn("truncate", collapsed && "sr-only")}>Tài khoản</span>
                                            </Link>,
                                            'Tài khoản'
                                        )}
                                        {withTooltip(
                                            <Link
                                                href="/dashboard/mail/history"
                                                prefetch={false}
                                                className={itemClassName(pathname === '/dashboard/mail/history', true)}
                                            >
                                                <History className="size-4 shrink-0" />
                                                <span className={cn("truncate", collapsed && "sr-only")}>Lịch sử</span>
                                            </Link>,
                                            'Lịch sử'
                                        )}
                                    </CollapsibleContent>
                                </Collapsible>
                            )}

                            {showQuiz && (
                                <Collapsible
                                open={openCategories['QuizSystem']}
                                onOpenChange={() => toggleCategory('QuizSystem')}
                                className="space-y-1"
                            >
                                {withTooltip(
                                    <CollapsibleTrigger className={cn(
                                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted/50",
                                        collapsed && "justify-center px-2"
                                    )}>
                                        <div className="flex min-w-0 items-center gap-3">
                                            <FileText className="size-4 shrink-0" />
                                            <span className={cn("truncate", collapsed && "sr-only")}>Quiz System</span>
                                        </div>
                                        <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", openCategories['QuizSystem'] && "rotate-90", collapsed && "hidden")} />
                                    </CollapsibleTrigger>,
                                    'Quiz System'
                                )}
                                <CollapsibleContent className="space-y-1 pt-1">
                                    {withTooltip(
                                        <Link
                                            href="/dashboard/quiz/my-quizzes"
                                            prefetch={false}
                                            className={itemClassName(pathname === '/dashboard/quiz/my-quizzes', true)}
                                        >
                                            <ListFilter className="size-4 shrink-0" />
                                            <span className={cn("truncate", collapsed && "sr-only")}>Bộ câu hỏi</span>
                                        </Link>,
                                        'Bộ câu hỏi'
                                    )}
                                    {withTooltip(
                                        <Link
                                            href="/dashboard/quiz/create"
                                            prefetch={false}
                                            className={itemClassName(pathname === '/dashboard/quiz/create', true)}
                                        >
                                            <PenTool className="size-4 shrink-0" />
                                            <span className={cn("truncate", collapsed && "sr-only")}>Tạo mới</span>
                                        </Link>,
                                        'Tạo mới'
                                    )}
                                    {withTooltip(
                                        <Link
                                            href="/dashboard/quiz/history"
                                            prefetch={false}
                                            className={itemClassName(pathname === '/dashboard/quiz/history', true)}
                                        >
                                            <History className="size-4 shrink-0" />
                                            <span className={cn("truncate", collapsed && "sr-only")}>Lịch sử</span>
                                        </Link>,
                                        'Lịch sử'
                                    )}
                                </CollapsibleContent>
                                </Collapsible>
                            )}

                            {showFlashcards && (
                                <Collapsible
                                open={openCategories['FlashcardSystem']}
                                onOpenChange={() => toggleCategory('FlashcardSystem')}
                                className="space-y-1"
                            >
                                <CollapsibleTrigger className={cn(
                                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted/50",
                                    collapsed && "justify-center px-2"
                                )}>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <BookOpen className="size-4 shrink-0" />
                                        <span className={cn("truncate", collapsed && "sr-only")}>Flashcards</span>
                                    </div>
                                    <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", openCategories['FlashcardSystem'] && "rotate-90", collapsed && "hidden")} />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-1 pt-1">
                                    {withTooltip(
                                        <Link
                                            href="/dashboard/flashcards/library"
                                            prefetch={false}
                                            className={itemClassName(pathname.startsWith('/dashboard/flashcards') && pathname !== '/dashboard/flashcards/create', true)}
                                        >
                                            <Layers className="size-4 shrink-0" />
                                            <span className={cn("truncate", collapsed && "sr-only")}>My Library</span>
                                        </Link>,
                                        'My Library'
                                    )}
                                    {withTooltip(
                                        <Link
                                            href="/dashboard/flashcards/create"
                                            prefetch={false}
                                            className={itemClassName(pathname === '/dashboard/flashcards/create', true)}
                                        >
                                            <PenTool className="size-4 shrink-0" />
                                            <span className={cn("truncate", collapsed && "sr-only")}>Tạo set</span>
                                        </Link>,
                                        'Tạo set'
                                    )}
                                </CollapsibleContent>
                                </Collapsible>
                            )}

                            <Separator />

                            {categoryItems.map(cat => {
                                const catModules = modulesByCategory[cat.key]
                                if (!catModules || catModules.length === 0) return null

                                return (
                                    <Collapsible
                                        key={cat.key}
                                        open={openCategories[cat.key]}
                                        onOpenChange={() => toggleCategory(cat.key)}
                                        className="space-y-1"
                                    >
                                        {withTooltip(
                                            <CollapsibleTrigger className={cn(
                                                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted/50",
                                                collapsed && "justify-center px-2"
                                            )}>
                                                <span className={cn("truncate text-xs font-medium uppercase text-muted-foreground", collapsed && "sr-only")}>{cat.name}</span>
                                                <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", openCategories[cat.key] && "rotate-90")} />
                                            </CollapsibleTrigger>,
                                            cat.name,
                                            cat.key
                                        )}
                                        <CollapsibleContent className="space-y-1 pt-1">
                                            {catModules.map((item) => {
                                                const isActive = pathname === item.href
                                                const Icon = getModuleIcon(item)

                                                const linkContent = withTooltip(
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        prefetch={false}
                                                        className={cn(
                                                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                                            !collapsed && 'pl-6',
                                                            collapsed && 'justify-center px-2',
                                                            isActive
                                                                ? 'bg-primary/10 text-primary font-medium'
                                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                        )}
                                                    >
                                                        <Icon className="size-4 shrink-0" />
                                                        <span className={cn("truncate", collapsed && "sr-only")}>{item.name}</span>
                                                    </Link>,
                                                    item.name,
                                                    item.href
                                                )

                                                if (item.permission) {
                                                    return (
                                                        <ProtectedFeature key={item.href} permission={item.permission as PermissionKey}>
                                                            {linkContent}
                                                        </ProtectedFeature>
                                                    )
                                                }

                                                return linkContent
                                            })}
                                        </CollapsibleContent>
                                    </Collapsible>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </TooltipProvider>
    )
}

export function Sidebar({ modules }: SidebarProps) {
    const [width, setWidth] = useState(() => {
        if (typeof window === 'undefined') return SIDEBAR_DEFAULT_WIDTH

        const storedWidth = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY))
        return Number.isFinite(storedWidth) && storedWidth > 0
            ? clampSidebarWidth(storedWidth)
            : SIDEBAR_DEFAULT_WIDTH
    })
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    })
    const [isResizing, setIsResizing] = useState(false)

    useEffect(() => {
        window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width))
    }, [width])

    useEffect(() => {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
    }, [collapsed])

    const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (collapsed) return

        event.preventDefault()
        setIsResizing(true)

        const startX = event.clientX
        const startWidth = width

        const onPointerMove = (moveEvent: PointerEvent) => {
            setWidth(clampSidebarWidth(startWidth + moveEvent.clientX - startX))
        }

        const onPointerUp = () => {
            setIsResizing(false)
            document.removeEventListener('pointermove', onPointerMove)
            document.removeEventListener('pointerup', onPointerUp)
        }

        document.addEventListener('pointermove', onPointerMove)
        document.addEventListener('pointerup', onPointerUp)
    }

    return (
        <aside
            className={cn(
                "relative hidden shrink-0 flex-col bg-sidebar md:flex",
                !isResizing && "transition-[width] duration-200"
            )}
            style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : width }}
        >
            <SidebarContent
                modules={modules}
                collapsed={collapsed}
                onToggleCollapsed={() => setCollapsed(value => !value)}
            />
            {!collapsed && (
                <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Kéo để đổi độ rộng sidebar"
                    tabIndex={0}
                    className="absolute inset-y-0 right-[-5px] z-20 flex w-2 cursor-col-resize items-center justify-center"
                    onPointerDown={startResize}
                >
                    <GripVertical className="size-3 rounded-sm bg-background text-muted-foreground opacity-0 shadow-xs ring-1 ring-border transition-opacity hover:opacity-100" />
                </div>
            )}
        </aside>
    )
}
