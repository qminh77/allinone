'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { createShortlink } from '@/lib/actions/shortlinks'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'

interface ShortlinkCreateDialogProps {
    onCreated: () => Promise<void> | void
}

export function ShortlinkCreateDialog({ onCreated }: ShortlinkCreateDialogProps) {
    const [open, setOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [targetUrl, setTargetUrl] = useState('')
    const [slug, setSlug] = useState('')
    const [password, setPassword] = useState('')
    const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
    const [usePassword, setUsePassword] = useState(false)

    const resetForm = () => {
        setTargetUrl('')
        setSlug('')
        setPassword('')
        setUsePassword(false)
        setExpiresAt(undefined)
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
            setOpen(false)
            resetForm()
            await onCreated()
        }
        setCreating(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !expiresAt && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expiresAt ? format(expiresAt, 'PPP') : <span>Pick a date</span>}
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
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={creating}>
                        {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
