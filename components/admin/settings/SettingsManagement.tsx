'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Edit, Loader2, Plus, Search, Settings, Trash2 } from 'lucide-react'
import { createSetting, deleteSetting, updateBooleanSetting, updateSetting } from '@/lib/actions/admin/settings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

const CORE_SETTINGS = new Set(['allow_registration', 'allow_login'])

interface SettingRow {
    key: string
    value: Record<string, unknown>
    description: string | null
    updated_at: string | null
    updated_by: string | null
}

interface SettingsManagementProps {
    settings: SettingRow[]
}

function stringifyValue(value: Record<string, unknown>) {
    return JSON.stringify(value || {}, null, 2)
}

function hasBooleanEnabled(value: Record<string, unknown>) {
    return typeof value?.enabled === 'boolean'
}

export function SettingsManagement({ settings }: SettingsManagementProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const [selectedSetting, setSelectedSetting] = useState<SettingRow | null>(null)
    const [settingToDelete, setSettingToDelete] = useState<SettingRow | null>(null)

    const filteredSettings = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return settings

        return settings.filter((setting) =>
            setting.key.toLowerCase().includes(query) ||
            (setting.description || '').toLowerCase().includes(query) ||
            stringifyValue(setting.value).toLowerCase().includes(query)
        )
    }, [search, settings])

    const openCreate = () => {
        setSelectedSetting(null)
        setOpen(true)
    }

    const openEdit = (setting: SettingRow) => {
        setSelectedSetting(setting)
        setOpen(true)
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            const result = selectedSetting
                ? await updateSetting(selectedSetting.key, formData)
                : await createSetting(formData)

            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success(selectedSetting ? 'Đã cập nhật setting' : 'Đã tạo setting')
            setOpen(false)
            setSelectedSetting(null)
            router.refresh()
        })
    }

    const handleToggle = (setting: SettingRow, enabled: boolean) => {
        startTransition(async () => {
            const result = await updateBooleanSetting(setting.key, enabled)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Đã cập nhật setting')
                router.refresh()
            }
        })
    }

    const handleDelete = () => {
        if (!settingToDelete) return

        startTransition(async () => {
            const result = await deleteSetting(settingToDelete.key)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Đã xóa setting')
                router.refresh()
            }
            setSettingToDelete(null)
        })
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Danh sách settings</CardTitle>
                            <CardDescription>
                                Giá trị lưu dạng JSON object. Core settings được bảo vệ khỏi xóa và đổi key.
                            </CardDescription>
                        </div>
                        <Button onClick={openCreate}>
                            <Plus className="size-4" />
                            Thêm setting
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tìm key, mô tả hoặc JSON..."
                            className="pl-9"
                        />
                    </div>

                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Setting</TableHead>
                                    <TableHead>Giá trị nhanh</TableHead>
                                    <TableHead>Cập nhật</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSettings.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Không tìm thấy setting
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredSettings.map((setting) => (
                                    <TableRow key={setting.key}>
                                        <TableCell>
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 grid size-9 place-items-center rounded-md bg-muted">
                                                    <Settings className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-mono text-sm font-medium">{setting.key}</p>
                                                        {CORE_SETTINGS.has(setting.key) && <Badge variant="secondary">Core</Badge>}
                                                    </div>
                                                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                                                        {setting.description || 'Không có mô tả'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {hasBooleanEnabled(setting.value) ? (
                                                <div className="flex items-center gap-3">
                                                    <Switch
                                                        checked={setting.value.enabled === true}
                                                        onCheckedChange={(checked) => handleToggle(setting, checked)}
                                                        disabled={isPending}
                                                    />
                                                    <span className="text-sm text-muted-foreground">
                                                        {setting.value.enabled ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <code className="line-clamp-2 block max-w-md rounded bg-muted px-2 py-1 text-xs">
                                                    {stringifyValue(setting.value)}
                                                </code>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {setting.updated_at ? new Date(setting.updated_at).toLocaleString('vi-VN') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(setting)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={CORE_SETTINGS.has(setting.key)}
                                                    onClick={() => setSettingToDelete(setting)}
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedSetting ? 'Chỉnh sửa setting' : 'Thêm setting'}</DialogTitle>
                        <DialogDescription>
                            JSON phải là object, ví dụ {"{ \"enabled\": true }"}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="key">Key *</Label>
                            <Input
                                id="key"
                                name="key"
                                required
                                readOnly={selectedSetting ? CORE_SETTINGS.has(selectedSetting.key) : false}
                                defaultValue={selectedSetting?.key || ''}
                                placeholder="feature_flag"
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Input
                                id="description"
                                name="description"
                                defaultValue={selectedSetting?.description || ''}
                                placeholder="Mục đích của setting..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="value">JSON value *</Label>
                            <Textarea
                                id="value"
                                name="value"
                                required
                                rows={9}
                                defaultValue={selectedSetting ? stringifyValue(selectedSetting.value) : '{\n  "enabled": true\n}'}
                                className="font-mono text-sm"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="size-4 animate-spin" />}
                                {selectedSetting ? 'Cập nhật' : 'Tạo setting'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!settingToDelete} onOpenChange={(nextOpen) => !nextOpen && setSettingToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa setting?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Setting &quot;{settingToDelete?.key}&quot; sẽ bị xóa khỏi cấu hình hệ thống.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
