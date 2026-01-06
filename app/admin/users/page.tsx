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
import { CreateUserDialog, EditUserDialog, DeleteUserAlert } from '@/components/admin/UserDialogs'
import { UserProfile } from '@/types/database'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    // Optimized: Limit to 30 most recent users
    const { data: users } = await supabase
        .from('user_profiles')
        .select(`
      *,
      role:roles(name)
    `)
        .order('created_at', { ascending: false })
        .limit(30)
        .returns<(UserProfile & { role: { name: string } | null })[]>()

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Người dùng</CardTitle>
                    <CardDescription>
                        Quản lý người dùng hệ thống ({users?.length || 0} hiển thị)
                    </CardDescription>
                </div>
                <CreateUserDialog />
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr className="border-b">
                                <th className="h-10 px-4 text-left align-middle font-medium">
                                    Người dùng
                                </th>
                                <th className="h-10 px-4 text-left align-middle font-medium">
                                    Vai trò
                                </th>
                                <th className="h-10 px-4 text-left align-middle font-medium">
                                    Trạng thái
                                </th>
                                <th className="h-10 px-4 text-left align-middle font-medium">
                                    Ngày tham gia
                                </th>
                                <th className="h-10 px-4 text-right align-middle font-medium">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <td className="p-4 align-middle">
                                        <div className="font-medium">
                                            {user.full_name || 'Không tên'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            ID: {user.id.slice(0, 8)}...
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <Badge
                                            variant={
                                                // @ts-ignore
                                                user.role?.name === 'Admin'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {/* @ts-ignore */}
                                            {user.role?.name || 'User'}
                                        </Badge>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <Badge
                                            variant={
                                                user.is_active
                                                    ? 'outline'
                                                    : 'destructive'
                                            }
                                            className={
                                                user.is_active
                                                    ? 'text-green-600 border-green-600'
                                                    : ''
                                            }
                                        >
                                            {user.is_active
                                                ? 'Hoạt động'
                                                : 'Bị khóa'}
                                        </Badge>
                                    </td>
                                    <td className="p-4 align-middle">
                                        {new Date(
                                            user.created_at
                                        ).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex justify-end gap-2">
                                            <EditUserDialog user={user} />
                                            <DeleteUserAlert userId={user.id} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
