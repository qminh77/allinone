'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CheckCircle, XCircle } from 'lucide-react'

// Define type matching the join query
interface MailLog {
    id: string
    config_id: string
    recipients: string[] | string
    subject: string
    body: string
    status: 'success' | 'failed'
    error_message: string | null
    sent_at: string
    smtp_configs: {
        name: string
    } | null
}

export function MailHistoryTable({ logs }: { logs: MailLog[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Lịch sử gửi Mail</CardTitle>
                <CardDescription>Danh sách các mail đã được xử lý.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Thời gian</TableHead>
                            <TableHead>Tài khoản</TableHead>
                            <TableHead>Người nhận</TableHead>
                            <TableHead>Tiêu đề</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Lỗi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    Chưa có lịch sử gửi mail.
                                </TableCell>
                            </TableRow>
                        ) : logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap font-mono text-xs">
                                    {format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm:ss')}
                                </TableCell>
                                <TableCell>{log.smtp_configs?.name || 'Đã xóa'}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={Array.isArray(log.recipients) ? log.recipients.join(', ') : log.recipients}>
                                    {Array.isArray(log.recipients) ? log.recipients.join(', ') : log.recipients}
                                </TableCell>
                                <TableCell className="font-medium max-w-[200px] truncate" title={log.subject}>
                                    {log.subject}
                                </TableCell>
                                <TableCell>
                                    {log.status === 'success' ? (
                                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 gap-1">
                                            <CheckCircle className="h-3 w-3" /> Success
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="gap-1">
                                            <XCircle className="h-3 w-3" /> Failed
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate text-red-500 text-xs" title={log.error_message || ''}>
                                    {log.error_message}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
