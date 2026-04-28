import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentUserProfile } from '@/lib/auth/session'
import { hasRole } from '@/lib/permissions/check'
import { AdminNavigation } from '@/components/admin/AdminNavigation'

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

    const profile = await getCurrentUserProfile(user.id)

    return (
        <div className="min-h-screen bg-muted/30 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
            <AdminNavigation
                userName={profile?.full_name || user.email || 'Admin'}
                userEmail={user.email || ''}
            />
            <main className="min-w-0 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
