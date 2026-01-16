'use client'

import { useState } from 'react'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Upload, Unlock, X, File as FileIcon } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'

interface UnlockPdfProps {
    slug: string
    title: string
    description: string
}

export function UnlockPDF({ slug, title, description }: UnlockPdfProps) {
    const [file, setFile] = useState<File | null>(null)
    const [password, setPassword] = useState('')
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

    const handleUnlock = async () => {
        if (!file) {
            toast.error('Vui lòng chọn file PDF.')
            return
        }

        if (!password) {
            toast.error('Vui lòng nhập mật khẩu.')
            return
        }

        setIsProcessing(true)
        try {
            const arrayBuffer = await file.arrayBuffer()

            // Try to load with password
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pdfDoc = await PDFDocument.load(arrayBuffer, { password } as any)

            // Save without encryption
            const pdfBytes = await pdfDoc.save()

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            saveAs(blob, `unlocked-${file.name}`)
            toast.success('Gỡ mật khẩu thành công!')
        } catch (error) {
            console.error(error)
            toast.error('Mật khẩu không đúng hoặc file bị lỗi.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <ToolShell title={title} description={description} icon={Unlock}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Gỡ Mật Khẩu PDF</CardTitle>
                        <CardDescription>
                            Xóa mật khẩu và quyền hạn chế từ file PDF (Nếu bạn biết mật khẩu).
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
                            <Label htmlFor="password">Mật khẩu file</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Nhập mật khẩu hiện tại..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                size="lg"
                                onClick={handleUnlock}
                                disabled={!file || !password || isProcessing}
                                className="w-full md:w-auto"
                            >
                                {isProcessing ? 'Đang xử lý...' : 'Gỡ Mật Khẩu'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ToolShell>
    )
}
