/**
 * Navbar Component
 */

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRole } from '@/lib/permissions/hooks'
import { Menu } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet'
import { SidebarContent } from '@/components/layout/Sidebar'
// Removed server action import as it cannot be used in client component directly without prop passing


interface NavbarProps {
    user: {
        email?: string
        fullName?: string | null
    }
    enabledModules?: Record<string, boolean>
}

export function Navbar({ user, enabledModules }: NavbarProps) {
    const router = useRouter()
    const { isAdmin } = useRole()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const initials = user.fullName
        ? user.fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : user.email?.slice(0, 2).toUpperCase() || 'U'

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex h-16 items-center px-4 sm:px-6">
                <div className="flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <div className="p-4 border-b">
                                <span className="text-xl font-bold">Tool Website</span>
                            </div>
                            <div className="h-full overflow-y-auto">
                                <SidebarContent enabledModules={enabledModules} />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <span className="text-xl font-bold hidden sm:inline-block">Tool Website</span>
                        <span className="text-xl font-bold sm:hidden">Tools</span>
                    </Link>
                </div>

                <div className="ml-auto flex items-center space-x-4">
                    {isAdmin() && (
                        <Button variant="outline" asChild className="hidden sm:flex">
                            <Link href="/admin">Admin CP</Link>
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full">
                                <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">{user.fullName || 'User'}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {isAdmin() && (
                                <DropdownMenuItem asChild className="sm:hidden">
                                    <Link href="/admin">Admin CP</Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={handleLogout}>
                                Đăng xuất
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    )
}

