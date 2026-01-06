'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { deleteUser, resetPassword } from '@/lib/actions/admin/users'
import { toast } from 'sonner'
import { Edit, Trash2, RefreshCw, Search, UserPlus, Upload } from 'lucide-react'
import { format } from 'date-fns'

interface User {
    id: string
    full_name: string
    email?: string
    is_active: boolean
    created_at: string
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

    const handleResetPassword = async (id: string, name: string) {
        if (!confirm(`Reset mật khẩu cho "${name}"?`)) return

        const result = await resetPassword(id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Mật khẩu mới: ${result.newPassword}`, {
                duration: 10000,
                description: 'Vui lòng copy và gửi cho người dùng'
            })
        }
    }

    return (
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
                            <TableHead>Tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    {search ? 'Không tìm thấy người dùng' : 'Chưa có người dùng'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                    <TableCell>{user.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {user.roles?.name || 'No Role'}
                                        </Badge>
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
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(user.created_at), 'dd/MM/yyyy')}
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
                                                onClick={() => handleResetPassword(user.id, user.full_name)}
                                                title="Reset mật khẩu"
                                            >
                                                <RefreshCw className="h-4 w-4" />
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
    )
}
