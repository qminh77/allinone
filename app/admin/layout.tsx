/**
 * Admin Layout
 */

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/permissions/check'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const isAdmin = await hasRole(user.id, 'Admin')

    if (!isAdmin) {
        redirect('/dashboard')
    }

    return (
        <div className="flex min-h-screen flex-col">
            <div className="border-b">
                <div className="flex h-16 items-center px-6">
                    <h1 className="text-xl font-bold">⚙️ Admin Control Panel</h1>
                    <Button variant="outline" asChild className="ml-auto">
                        <Link href="/dashboard">← Về Dashboard</Link>
                    </Button>
                </div>
            </div>

            <div className="flex-1 p-6">
                <Tabs defaultValue="users" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="users" asChild>
                            <Link href="/admin/users">Users</Link>
                        </TabsTrigger>
                        <TabsTrigger value="roles" asChild>
                            <Link href="/admin/roles">Roles</Link>
                        </TabsTrigger>
                        <TabsTrigger value="modules" asChild>
                            <Link href="/admin/modules">Modules</Link>
                        </TabsTrigger>
                        <TabsTrigger value="settings" asChild>
                            <Link href="/admin/settings">Settings</Link>
                        </TabsTrigger>
                        <TabsTrigger value="logs" asChild>
                            <Link href="/admin/logs">Audit Logs</Link>
                        </TabsTrigger>
                    </TabsList>

                    {children}
                </Tabs>
            </div>
        </div>
    )
}
