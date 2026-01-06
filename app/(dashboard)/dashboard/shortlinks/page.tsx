'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createShortlink, deleteShortlink, getShortlinks } from '@/lib/actions/shortlinks'
import { Shortlink } from '@/types/database'
import { toast } from 'sonner'
import { CalendarIcon, Copy, Link, Loader2, Plus, Trash2, Lock, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function ShortlinksPage() {
    const [links, setLinks] = useState<Shortlink[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [creating, setCreating] = useState(false)

    // Form State
    const [targetUrl, setTargetUrl] = useState('')
    const [slug, setSlug] = useState('')
    const [password, setPassword] = useState('')
    const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
    const [usePassword, setUsePassword] = useState(false)

    useEffect(() => {
        loadLinks()
    }, [])

    const loadLinks = async () => {
        const data = await getShortlinks()
        setLinks(data as any)
        setLoading(false)
    }

    const handleCreate = async () => {
        if (!targetUrl) return
        setCreating(true)

        const formData = new FormData()
        formData.append('target_url', targetUrl)
        if (slug) formData.append('slug', slug)
        if (usePassword && password) formData.append('password', password)
        if (expiresAt) formData.append('expires_at', expiresAt.toISOString())

        const res = await createShortlink(formData)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Shortlink created!')
            setIsCreateOpen(false)
            resetForm()
            loadLinks()
        }
        setCreating(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return
        const res = await deleteShortlink(id)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Deleted')
            loadLinks()
        }
    }

    const resetForm = () => {
        setTargetUrl('')
        setSlug('')
        setPassword('')
        setUsePassword(false)
        setExpiresAt(undefined)
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
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" /> Create New
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Shortlink</DialogTitle>
                            <DialogDescription>
                                Create a shortened URL with optional security.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Target URL</Label>
                                <Input placeholder="https://very-long-url.com/..." value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Custom Slug (Optional)</Label>
                                <div className="flex items-center">
                                    <span className="bg-muted px-3 py-2 rounded-l-md text-sm border border-r-0 text-muted-foreground">/</span>
                                    <Input
                                        placeholder="my-link"
                                        value={slug}
                                        onChange={e => setSlug(e.target.value)}
                                        className="rounded-l-none"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Letters, numbers, hyphens only.</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label>Password Protection</Label>
                                <Switch checked={usePassword} onCheckedChange={setUsePassword} />
                            </div>
                            {usePassword && (
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <Input type="password" placeholder="***" value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <Label>Expiration Date (Optional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !expiresAt && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {expiresAt ? format(expiresAt, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={expiresAt}
                                            onSelect={setExpiresAt}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={creating}>
                                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                                                {link.password_hash && <Lock className="h-4 w-4 text-orange-500" title="Password Protected" />}
                                                {link.expires_at && <Clock className="h-4 w-4 text-blue-500" title={`Expires: ${new Date(link.expires_at).toLocaleDateString()}`} />}
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
