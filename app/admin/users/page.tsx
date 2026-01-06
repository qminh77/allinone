/**
 * Admin Users Page
 */

import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    // Optimized: Limit to 30 most recent users
    const { data: users } = (await supabase
        .from('user_profiles')
        .select(`
      *,
      role:roles(name)
    `)
        .order('created_at', { ascending: false })
        .limit(30)) as { data: any[] }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Quản lý Users</CardTitle>
                <CardDescription>
                    30 người dùng gần nhất
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Họ tên</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    {/* Email từ auth.users không có trong profile */}
                                    {user.id.slice(0, 8)}...
                                </TableCell>
                                <TableCell>{user.full_name || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {/* @ts-ignore */}
                                        {user.role?.name || 'No role'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.is_active ? (
                                        <Badge variant="default">Hoạt động</Badge>
                                    ) : (
                                        <Badge variant="destructive">Bị khóa</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
