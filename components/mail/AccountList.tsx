'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash, Server, Shield, ShieldAlert, Mail } from 'lucide-react'
import { deleteSmtpConfig } from '@/lib/actions/mail'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'

interface SmtpConfig {
    id: string
    name: string
    host: string
    port: number
    secure: boolean
    username: string | null
    from_email: string
    created_at: string
}

export function AccountList({ configs }: { configs: SmtpConfig[] }) {

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa cấu hình này?')) return
        const res = await deleteSmtpConfig(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Đã xóa cấu hình!')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Danh sách tài khoản SMTP</CardTitle>
                <CardDescription>Quản lý các tài khoản dùng để gửi mail.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên</TableHead>
                            <TableHead>Host</TableHead>
                            <TableHead>Port</TableHead>
                            <TableHead>Secure</TableHead>
                            <TableHead>From Email</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {configs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    Chưa có tài khoản nào.
                                </TableCell>
                            </TableRow>
                        ) : configs.map((config) => (
                            <TableRow key={config.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        {config.name}
                                    </div>
                                </TableCell>
                                <TableCell>{config.host}</TableCell>
                                <TableCell>{config.port}</TableCell>
                                <TableCell>
                                    {config.secure ?
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1"><Shield className="h-3 w-3" /> SSL/TLS</Badge> :
                                        <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 gap-1"><ShieldAlert className="h-3 w-3" /> None</Badge>
                                    }
                                </TableCell>
                                <TableCell>{config.from_email}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(config.id)}>
                                        <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
