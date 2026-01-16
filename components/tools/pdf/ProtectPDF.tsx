'use client'

import { useState } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Upload, Lock, X, File as FileIcon } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'

interface ProtectPdfProps {
    slug: string
    title: string
    description: string
}

export function ProtectPDF({ slug, title, description }: ProtectPdfProps) {
    const [file, setFile] = useState<File | null>(null)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Chỉ chấp nhận file định dạng PDF!')
                return
            }
            setFile(selectedFile)
        }
    }

    const removeFile = () => {
        setFile(null)
    }

    const handleProtect = async () => {
        if (!file) {
            toast.error('Vui lòng chọn file PDF.')
            return
        }

        if (!password) {
            toast.error('Vui lòng nhập mật khẩu.')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp.')
            return
        }

        setIsProcessing(true)
        try {
            const arrayBuffer = await file.arrayBuffer()
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (pdfDoc as any).encrypt({
                userPassword: password,
                ownerPassword: password, // Simple protection: same user/owner pass
                permissions: {
                    printing: 'highResolution',
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    contentAccessibility: false,
                    documentAssembly: false,
                },
            })

            const pdfBytes = await pdfDoc.save()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            saveAs(blob, `protected-${file.name}`)
            toast.success('Đặt mật khẩu PDF thành công!')
        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra khi xử lý file.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <ToolShell title={title} description={description} icon={Lock}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Bảo vệ PDF</CardTitle>
                        <CardDescription>
                            Đặt mật khẩu và hạn chế quyền truy cập cho file PDF của bạn.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!file ? (
                            <div className="flex items-center gap-4">
                                <Label
                                    htmlFor="pdf-upload"
                                    className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors w-full h-32 flex-col gap-2"
                                >
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                    <span className="text-muted-foreground text-sm font-medium">Nhấn để tải lên file PDF</span>
                                    <input
                                        id="pdf-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                    />
                                </Label>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex flex-col items-center justify-center w-8 h-8 bg-primary/10 rounded">
                                        <FileIcon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="grid gap-0.5">
                                        <span className="text-sm font-medium truncate max-w-[300px]">{file.name}</span>
                                        <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={removeFile}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Nhập mật khẩu..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Nhập lại mật khẩu..."
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                size="lg"
                                onClick={handleProtect}
                                disabled={!file || !password || !confirmPassword || isProcessing}
                                className="w-full md:w-auto"
                            >
                                {isProcessing ? 'Đang xử lý...' : 'Bảo vệ PDF'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ToolShell>
    )
}
