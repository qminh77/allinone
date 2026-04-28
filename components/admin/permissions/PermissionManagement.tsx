'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Edit, Key, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { createPermission, deletePermission, updatePermission } from '@/lib/actions/admin/permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface Permission {
    id: string
    key: string
    name: string
    module: string | null
    description: string | null
    roleCount?: number
}

interface PermissionManagementProps {
    permissions: Permission[]
}

export function PermissionManagement({ permissions }: PermissionManagementProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [search, setSearch] = useState('')
    const [moduleFilter, setModuleFilter] = useState('all')
    const [open, setOpen] = useState(false)
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
    const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null)

    const modules = useMemo(() => {
        return Array.from(new Set(permissions.map((permission) => permission.module || 'other'))).sort()
    }, [permissions])

    const filteredPermissions = useMemo(() => {
        const query = search.trim().toLowerCase()

        return permissions.filter((permission) => {
            const matchesModule = moduleFilter === 'all' || (permission.module || 'other') === moduleFilter
            const matchesSearch = !query ||
                permission.key.toLowerCase().includes(query) ||
                permission.name.toLowerCase().includes(query) ||
                (permission.description || '').toLowerCase().includes(query)

            return matchesModule && matchesSearch
        })
    }, [moduleFilter, permissions, search])

    const openCreate = () => {
        setSelectedPermission(null)
        setOpen(true)
    }

    const openEdit = (permission: Permission) => {
        setSelectedPermission(permission)
        setOpen(true)
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            const result = selectedPermission
                ? await updatePermission(selectedPermission.id, formData)
                : await createPermission(formData)

            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success(selectedPermission ? 'Đã cập nhật quyền' : 'Đã tạo quyền')
            setOpen(false)
            setSelectedPermission(null)
            router.refresh()
        })
    }

    const handleDelete = () => {
        if (!permissionToDelete) return

        startTransition(async () => {
            const result = await deletePermission(permissionToDelete.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Đã xóa quyền')
                router.refresh()
            }
            setPermissionToDelete(null)
        })
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Danh sách permissions</CardTitle>
                            <CardDescription>
                                Permission key là contract dùng bởi phân quyền, cần đặt ổn định và dễ truy vết.
                            </CardDescription>
                        </div>
                        <Button onClick={openCreate}>
                            <Plus className="size-4" />
                            Thêm quyền
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Tìm key, tên hoặc mô tả..."
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                            <Button
                                type="button"
                                variant={moduleFilter === 'all' ? 'default' : 'outline'}
                                onClick={() => setModuleFilter('all')}
                            >
                                Tất cả
                            </Button>
                            {modules.map((moduleKey) => (
                                <Button
                                    key={moduleKey}
                                    type="button"
                                    variant={moduleFilter === moduleKey ? 'default' : 'outline'}
                                    onClick={() => setModuleFilter(moduleKey)}
                                >
                                    {moduleKey}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Permission</TableHead>
                                    <TableHead>Module</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Mô tả</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPermissions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Không tìm thấy permission
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredPermissions.map((permission) => (
                                    <TableRow key={permission.id}>
                                        <TableCell>
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 grid size-9 place-items-center rounded-md bg-muted">
                                                    <Key className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium">{permission.name}</p>
                                                    <p className="truncate font-mono text-xs text-muted-foreground">{permission.key}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{permission.module || 'other'}</Badge>
                                        </TableCell>
                                        <TableCell>{permission.roleCount || 0}</TableCell>
                                        <TableCell className="max-w-md text-sm text-muted-foreground">
                                            {permission.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(permission)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={(permission.roleCount || 0) > 0}
                                                    onClick={() => setPermissionToDelete(permission)}
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
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedPermission ? 'Chỉnh sửa permission' : 'Thêm permission'}</DialogTitle>
                        <DialogDescription>
                            Key nên dùng dạng module.action, ví dụ users.view hoặc tools.jsonvalidator.access.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="key">Key *</Label>
                            <Input
                                id="key"
                                name="key"
                                required
                                defaultValue={selectedPermission?.key || ''}
                                placeholder="users.view"
                                className="font-mono"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    defaultValue={selectedPermission?.name || ''}
                                    placeholder="Xem người dùng"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="module">Module</Label>
                                <Input
                                    id="module"
                                    name="module"
                                    defaultValue={selectedPermission?.module || ''}
                                    placeholder="users"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={selectedPermission?.description || ''}
                                placeholder="Mô tả phạm vi quyền..."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="size-4 animate-spin" />}
                                {selectedPermission ? 'Cập nhật' : 'Tạo quyền'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!permissionToDelete} onOpenChange={(nextOpen) => !nextOpen && setPermissionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa permission?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Permission &quot;{permissionToDelete?.key}&quot; chỉ có thể xóa khi chưa được gán cho role nào.
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
