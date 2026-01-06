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

interface NavbarProps {
    user: {
        email?: string
        fullName?: string | null
    }
}

export function Navbar({ user }: NavbarProps) {
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
        <nav className="border-b bg-background">
            <div className="flex h-16 items-center px-6">
                <Link href="/dashboard" className="flex items-center space-x-2">
                    <span className="text-xl font-bold">Tool Website</span>
                </Link>

                <div className="ml-auto flex items-center space-x-4">
                    {isAdmin() && (
                        <Button variant="outline" asChild>
                            <Link href="/admin">Admin CP</Link>
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar>
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
