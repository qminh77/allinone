'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Edit, Key, Loader2, Plus, Search, Shield, Trash2, Users } from 'lucide-react'
import { createRole, deleteRole, updateRole, updateRolePermissions } from '@/lib/actions/admin/roles'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
}

interface Role {
    id: string
    name: string
    description: string | null
    is_system: boolean
    created_at?: string
    permissionCount: number
    userCount: number
    permissionIds?: string[]
}

interface RoleManagementProps {
    roles: Role[]
    permissions: Permission[]
}

export function RoleManagement({ roles, permissions }: RoleManagementProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

    const permissionGroups = useMemo(() => {
        return permissions.reduce<Record<string, Permission[]>>((acc, permission) => {
            const moduleKey = permission.module || 'other'
            acc[moduleKey] ||= []
            acc[moduleKey].push(permission)
            return acc
        }, {})
    }, [permissions])

    const filteredRoles = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return roles

        return roles.filter((role) =>
            role.name.toLowerCase().includes(query) ||
            (role.description || '').toLowerCase().includes(query)
        )
    }, [roles, search])

    const openCreate = () => {
        setSelectedRole(null)
        setSelectedPermissions([])
        setOpen(true)
    }

    const openEdit = (role: Role) => {
        setSelectedRole(role)
        setSelectedPermissions(role.permissionIds || [])
        setOpen(true)
    }

    const togglePermission = (permissionId: string, checked: boolean) => {
        setSelectedPermissions((current) => {
            if (checked) return Array.from(new Set([...current, permissionId]))
            return current.filter((id) => id !== permissionId)
        })
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            try {
                const result = selectedRole
                    ? await updateRole(selectedRole.id, formData)
                    : await createRole(formData)

                if (result.error) {
                    toast.error(result.error)
                    return
                }

                const createdRole = 'role' in result
                    ? result.role as { id?: string } | undefined
                    : undefined
                const roleId = selectedRole?.id || createdRole?.id || null
                if (roleId) {
                    const permissionsResult = await updateRolePermissions(roleId, selectedPermissions)
                    if (permissionsResult.error) {
                        toast.error(permissionsResult.error)
                        return
                    }
                }

                toast.success(selectedRole ? 'Đã cập nhật vai trò' : 'Đã tạo vai trò')
                setOpen(false)
                setSelectedRole(null)
                setSelectedPermissions([])
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Không thể lưu vai trò')
            }
        })
    }

    const handleDelete = () => {
        if (!roleToDelete) return

        startTransition(async () => {
            try {
                const result = await deleteRole(roleToDelete.id)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Đã xóa vai trò')
                    router.refresh()
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Không thể xóa vai trò')
            }
            setRoleToDelete(null)
        })
    }

    const allPermissionIds = permissions.map((permission) => permission.id)
    const allChecked = selectedPermissions.length === allPermissionIds.length && allPermissionIds.length > 0

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Danh sách vai trò</CardTitle>
                            <CardDescription>
                                Tạo, chỉnh sửa, xóa role và gán permission theo nhóm module.
                            </CardDescription>
                        </div>
                        <Button onClick={openCreate}>
                            <Plus className="size-4" />
                            Thêm vai trò
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tìm theo tên hoặc mô tả..."
                            className="pl-9"
                        />
                    </div>

                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vai trò</TableHead>
                                    <TableHead>Permissions</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Loại</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRoles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Không tìm thấy vai trò
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredRoles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 grid size-9 place-items-center rounded-md bg-muted">
                                                    <Shield className="size-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{role.name}</p>
                                                    <p className="max-w-xl text-sm text-muted-foreground">
                                                        {role.description || 'Không có mô tả'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                <Key className="mr-1 size-3" />
                                                {role.permissionCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                <Users className="mr-1 size-3" />
                                                {role.userCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={role.is_system ? 'secondary' : 'outline'}>
                                                {role.is_system ? 'System' : 'Custom'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(role)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={role.is_system || role.userCount > 0}
                                                    onClick={() => setRoleToDelete(role)}
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
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedRole ? 'Chỉnh sửa vai trò' : 'Thêm vai trò'}</DialogTitle>
                        <DialogDescription>
                            Role hệ thống không thể đổi tên hoặc xóa, nhưng vẫn có thể rà lại bộ quyền khi cần.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên vai trò *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    defaultValue={selectedRole?.name || ''}
                                    readOnly={selectedRole?.is_system}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Loại</Label>
                                <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm">
                                    {selectedRole?.is_system ? 'System role' : 'Custom role'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={selectedRole?.description || ''}
                                placeholder="Mô tả phạm vi sử dụng của vai trò..."
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <Label>Permissions</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Đã chọn {selectedPermissions.length}/{permissions.length} quyền.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedPermissions(allChecked ? [] : allPermissionIds)}
                                >
                                    {allChecked ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(permissionGroups).map(([moduleKey, modulePermissions]) => (
                                    <div key={moduleKey} className="rounded-md border">
                                        <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
                                            <Badge variant="outline">{moduleKey}</Badge>
                                            <span className="text-xs text-muted-foreground">{modulePermissions.length} quyền</span>
                                        </div>
                                        <div className="grid gap-3 p-3 sm:grid-cols-2">
                                            {modulePermissions.map((permission) => (
                                                <label
                                                    key={permission.id}
                                                    className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50"
                                                >
                                                    <Checkbox
                                                        checked={selectedPermissions.includes(permission.id)}
                                                        onCheckedChange={(checked) => togglePermission(permission.id, checked === true)}
                                                    />
                                                    <span className="min-w-0">
                                                        <span className="block text-sm font-medium">{permission.name}</span>
                                                        <span className="block truncate font-mono text-xs text-muted-foreground">{permission.key}</span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="size-4 animate-spin" />}
                                {selectedRole ? 'Cập nhật' : 'Tạo vai trò'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!roleToDelete} onOpenChange={(nextOpen) => !nextOpen && setRoleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa vai trò?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vai trò &quot;{roleToDelete?.name}&quot; sẽ bị xóa nếu không còn user nào đang dùng.
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
