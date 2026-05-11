'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { deleteShortlink, getShortlinks } from '@/lib/actions/shortlinks'
import { Shortlink } from '@/types/database'
import { toast } from 'sonner'
import { Copy, Link, Loader2, Trash2, Lock, Clock } from 'lucide-react'

const ShortlinkCreateDialog = dynamic(
    () => import('@/components/shortlinks/ShortlinkCreateDialog').then(module => module.ShortlinkCreateDialog),
    {
        ssr: false,
        loading: () => (
            <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Create New
            </Button>
        ),
    }
)

export default function ShortlinksPage() {
    const [links, setLinks] = useState<Shortlink[]>([])
    const [loading, setLoading] = useState(true)

    const loadLinks = useCallback(async () => {
        const data = await getShortlinks()
        setLinks(data as Shortlink[])
        setLoading(false)
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial client fetch for this client-only dashboard view.
        loadLinks()
    }, [loadLinks])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return
        const res = await deleteShortlink(id)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Deleted')
            loadLinks()
        }
    }

    const copyLink = (slug: string) => {
        const url = `${window.location.origin}/${slug}`
        navigator.clipboard.writeText(url)
        toast.success('Copied: ' + url)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shortlinks</h1>
                    <p className="text-muted-foreground">Manage your custom URL shorteners.</p>
                </div>
                <ShortlinkCreateDialog onCreated={loadLinks} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Links</CardTitle>
                    <CardDescription>All active and expired shortlinks.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : links.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">No shortlinks created yet.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Slug</TableHead>
                                    <TableHead className="max-w-[200px] truncate">Target</TableHead>
                                    <TableHead>Features</TableHead>
                                    <TableHead>Clicks</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {links.map(link => (
                                    <TableRow key={link.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={() => copyLink(link.slug)}>
                                                <Link className="h-3 w-3" />
                                                /{link.slug}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={link.target_url}>
                                            {link.target_url}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {link.password_hash && <span title="Password Protected"><Lock className="h-4 w-4 text-orange-500" /></span>}
                                                {link.expires_at && <span title={`Expires: ${new Date(link.expires_at).toLocaleDateString()}`}><Clock className="h-4 w-4 text-blue-500" /></span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{link.clicks}</TableCell>
                                        <TableCell>{new Date(link.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => copyLink(link.slug)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(link.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
