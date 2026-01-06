/**
 * Dashboard Layout
 */

import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentUserProfile } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const profile = await getCurrentUserProfile()

    return (
        <div className="flex h-screen flex-col">
            <Navbar
                user={{
                    email: user.email,
                    fullName: profile?.full_name,
                }}
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
