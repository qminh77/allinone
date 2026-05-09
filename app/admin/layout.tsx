import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentUserProfile } from '@/lib/auth/session'
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

    const profile = await getCurrentUserProfile(user.id)
    const isAdmin = profile?.role?.name === 'Admin'

    if (!isAdmin) {
        redirect('/dashboard')
    }

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
