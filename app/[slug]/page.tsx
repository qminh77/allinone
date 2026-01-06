import { notFound, redirect } from 'next/navigation'
import { getPublicShortlink } from '@/lib/actions/shortlinks'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Metadata } from 'next'
import PasswordProtection from '@/components/shortlinks/PasswordProtection'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    return {
        title: 'Redirecting...',
        robots: 'noindex'
    }
}

export default async function ShortlinkRedirectPage({ params }: { params: { slug: string } }) {
    const { slug } = await params
    const data = await getPublicShortlink(slug)

    if (!data) {
        notFound()
    }

    // 1. Expiration Check
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-2">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <CardTitle className="text-red-600">Link Expired</CardTitle>
                        <CardDescription>
                            This shortlink is no longer active.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // 2. Password Check
    if (data.password_hash) {
        // Render Client Component for Password Input
        return <PasswordProtection slug={slug} />
    }

    // 3. Direct Redirect
    // TODO: Increment clicks here (async if possible)
    redirect(data.target_url)
}
