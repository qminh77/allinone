'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { deleteUser } from '@/lib/actions/admin/users'
import { toast } from 'sonner'
import { Edit, Trash2, KeyRound, Search, UserPlus, Upload, Monitor, Globe } from 'lucide-react'
import { format } from 'date-fns'
import { PasswordChangeDialog } from './PasswordChangeDialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface User {
    id: string
    full_name: string
    email?: string
    is_active: boolean
    created_at: string
    last_ip?: string
    last_device?: string
    last_login?: string
    roles?: {
        id: string
        name: string
    }
}

interface UserListProps {
    users: User[]
    onEdit: (user: User) => void
    onImport: () => void
    onAdd: () => void
}

export function UserList({ users, onEdit, onImport, onAdd }: UserListProps) {
    const [search, setSearch] = useState('')
    const [deleting, setDeleting] = useState<string | null>(null)
    const [passwordDialog, setPasswordDialog] = useState<{ open: boolean, userId: string, userName: string }>({
        open: false,
        userId: '',
        userName: ''
    })

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    )

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa người dùng "${name}"?`)) return

        setDeleting(id)
        const result = await deleteUser(id)
        setDeleting(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Đã xóa người dùng')
            window.location.reload()
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Quản lý người dùng</CardTitle>
                            <CardDescription>Tổng số: {users.length} người dùng</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onImport}>
                                <Upload className="mr-2 h-4 w-4" />
                                Import CSV
                            </Button>
                            <Button onClick={onAdd}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Thêm người dùng
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Thông tin</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Truy cập gần nhất</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        {search ? 'Không tìm thấy người dùng' : 'Chưa có người dùng'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.full_name}</span>
                                                <span className="text-sm text-muted-foreground">{user.email || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {user.roles?.name || 'No Role'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {user.last_login ? (
                                                    <>
                                                        <div className="flex items-center text-xs text-muted-foreground" title="Last IP">
                                                            <Globe className="mr-1 h-3 w-3" />
                                                            {user.last_ip || 'Unknown IP'}
                                                        </div>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center text-xs text-muted-foreground max-w-[200px] truncate cursor-help">
                                                                        <Monitor className="mr-1 h-3 w-3" />
                                                                        {user.last_device || 'Unknown Device'}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="max-w-xs break-words text-xs">{user.last_device}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <div className="text-xs text-gray-500">
                                                            {format(new Date(user.last_login), 'dd/MM/yyyy HH:mm')}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Chưa đăng nhập</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.is_active ? (
                                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                                    Hoạt động
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Vô hiệu</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onEdit(user)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setPasswordDialog({
                                                        open: true,
                                                        userId: user.id,
                                                        userName: user.full_name
                                                    })}
                                                    title="Đổi mật khẩu"
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(user.id, user.full_name)}
                                                    disabled={deleting === user.id}
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <PasswordChangeDialog
                open={passwordDialog.open}
                onClose={() => setPasswordDialog(prev => ({ ...prev, open: false }))}
                userId={passwordDialog.userId}
                userName={passwordDialog.userName}
            />
        </>
    )
}
