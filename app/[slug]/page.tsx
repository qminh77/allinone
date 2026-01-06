import { notFound, redirect } from 'next/navigation'
import { getPublicShortlink, verifyShortlinkPassword } from '@/lib/actions/shortlinks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Lock, AlertCircle } from 'lucide-react'
import { Metadata } from 'next'

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

// Client Component for Password
'use client'
import { useState } from 'react'

function PasswordProtection({ slug }: { slug: string }) {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await verifyShortlinkPassword(slug, password)
        if (res.error) {
            setError(res.error)
            setLoading(false)
        } else if (res.url) {
            window.location.href = res.url
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit">
                        <Lock className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Protected Link</CardTitle>
                    <CardDescription>
                        This link requires a password to access.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter password..."
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? 'Verifying...' : 'Access Link'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
