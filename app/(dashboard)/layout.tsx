import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentUserProfile } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { getModuleCatalog } from '@/lib/modules/catalog'
import { AiAssistantDock } from '@/components/ai/AiAssistantDock'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const [profile, moduleCatalog] = await Promise.all([
        getCurrentUserProfile(user.id),
        getModuleCatalog(),
    ])

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar modules={moduleCatalog} />

            <div className="flex flex-col flex-1 overflow-hidden">
                <Navbar
                    user={{
                        email: user.email,
                        fullName: profile?.full_name,
                    }}
                    modules={moduleCatalog}
                    isAdmin={profile?.role?.name === 'Admin'}
                />
                <main className="flex-1 overflow-y-auto bg-muted/20 p-3 sm:p-4 lg:p-6">
                    {children}
                </main>
                <AiAssistantDock />
            </div>
        </div>
    )
}
