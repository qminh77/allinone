'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { bulkImportUsers } from '@/lib/actions/admin/users'
import { toast } from 'sonner'
import { Loader2, Download, Upload, CheckCircle, XCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface UserImportDialogProps {
    open: boolean
    onClose: () => void
}

export function UserImportDialog({ open, onClose }: UserImportDialogProps) {
    const [loading, setLoading] = useState(false)
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [results, setResults] = useState<any[] | null>(null)

    const downloadTemplate = () => {
        const csvContent = 'email,full_name,role\nuser@example.com,John Doe,User\nadmin@example.com,Admin User,Admin'
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'users_template.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.name.endsWith('.csv')) {
                toast.error('Vui lòng chọn file CSV')
                return
            }
            setCsvFile(file)
            setResults(null)
        }
    }

    const handleImport = async () => {
        if (!csvFile) {
            toast.error('Vui lòng chọn file CSV')
            return
        }

        setLoading(true)
        const text = await csvFile.text()
        const result = await bulkImportUsers(text)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            setResults(result.results || [])
            const successCount = result.results?.filter((r: any) => r.success).length || 0
            toast.success(`Đã import ${successCount}/${result.results?.length || 0} người dùng`)
        }
    }

    const handleClose = () => {
        setCsvFile(null)
        setResults(null)
        onClose()
        if (results?.some((r: any) => r.success)) {
            window.location.reload()
        }
    }

    const exportResults = () => {
        if (!results) return

        const headers = 'email,full_name,role,status,password,error\n'
        const rows = results.map(r =>
            `${r.email},${r.fullName},${r.role},${r.success ? 'success' : 'failed'},${r.tempPassword || ''},${r.error || ''}`
        ).join('\n')

        const blob = new Blob([headers + rows], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `import_results_${new Date().getTime()}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import người dùng từ CSV</DialogTitle>
                    <DialogDescription>
                        Tải file CSV chứa danh sách người dùng cần tạo
                    </DialogDescription>
                </DialogHeader>

                {!results ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>File CSV</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="flex-1 text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadTemplate}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Tải mẫu
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                File CSV phải có 3 cột: email, full_name, role
                            </p>
                        </div>

                        {csvFile && (
                            <div className="rounded-lg border bg-muted p-3">
                                <p className="text-sm font-medium">File đã chọn:</p>
                                <p className="text-sm text-muted-foreground">{csvFile.name}</p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Hủy
                            </Button>
                            <Button onClick={handleImport} disabled={!csvFile || loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Upload className="mr-2 h-4 w-4" />
                                Import
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Kết quả import</h4>
                            <Button variant="outline" size="sm" onClick={exportResults}>
                                <Download className="mr-2 h-4 w-4" />
                                Tải kết quả
                            </Button>
                        </div>

                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Tên</TableHead>
                                        <TableHead>Vai trò</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Mật khẩu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((result, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="text-sm">{result.email}</TableCell>
                                            <TableCell className="text-sm">{result.fullName}</TableCell>
                                            <TableCell className="text-sm">{result.role}</TableCell>
                                            <TableCell>
                                                {result.success ? (
                                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Thành công
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        <XCircle className="mr-1 h-3 w-3" />
                                                        Thất bại
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {result.tempPassword || result.error}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleClose}>Đóng</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
