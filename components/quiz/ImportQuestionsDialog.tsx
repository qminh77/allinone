'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Loader2, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { createQuestionsBatch } from '@/lib/actions/quiz'

interface ImportQuestionsDialogProps {
    quizId: string
}

export function ImportQuestionsDialog({ quizId }: ImportQuestionsDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [stats, setStats] = useState<{ total: number, valid: number } | null>(null)
    const [parsedData, setParsedData] = useState<any[] | null>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        const reader = new FileReader()

        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 })

                parseData(data)
            } catch (error) {
                console.error(error)
                toast.error("Lỗi đọc file. Hãy đảm bảo file đúng định dạng Excel/CSV.")
                setIsLoading(false)
            }
        }
        reader.readAsBinaryString(file)
    }

    const parseData = (rows: any[]) => {
        // Headers: Question, Type, Correct, Option A, Option B...
        // Assuming row 0 is header? Let's check. 
        // We will look for "Question" or "Câu hỏi" column.
        // Or just assume standard simple format:
        // Col A: Question Content
        // Col B: Type (1=Single, 2=Multi or text)
        // Col C: Correct Answer (e.g. "A" or "1" or "A,B")
        // Col D+: Options

        if (rows.length < 2) {
            toast.error("File không có dữ liệu")
            setIsLoading(false)
            return
        }

        const questions: any[] = []

        // Skip header if it looks like header
        const startIndex = 1

        for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i]
            if (!row || !row[0]) continue

            const content = row[0]
            const typeRaw = row[1]?.toString().toLowerCase() || 'single'
            const correctRaw = row[2]?.toString() || ''
            const explanation = row[3]?.toString() || ''
            const mediaTypeRaw = row[4]?.toString().toLowerCase() || ''
            const mediaUrl = row[5]?.toString() || ''

            // validation for media type
            let media_type: 'image' | 'youtube' | undefined = undefined
            if (mediaTypeRaw.includes('image') || mediaTypeRaw.includes('ảnh')) media_type = 'image'
            if (mediaTypeRaw.includes('youtube') || mediaTypeRaw.includes('video')) media_type = 'youtube'

            // Collect options
            const options: string[] = []
            // Starting from column 6 (G)
            for (let j = 6; j < row.length; j++) {
                if (row[j] !== undefined && row[j] !== null && row[j].toString().trim() !== '') {
                    options.push(row[j].toString().trim())
                }
            }

            // Determine type
            let type = 'single'
            if (typeRaw.includes('multi') || typeRaw.includes('nhiều') || typeRaw.includes('checkbox')) {
                type = 'multiple'
            } else if (correctRaw.includes(',') || correctRaw.length > 1) {
                // Heuristic: if correct answer has comma, likely multiple
                // But check if it's "A,B" type
                if (correctRaw.includes(',')) type = 'multiple'
            }

            // Determine correct indices
            // Supported formats: "A", "1", "A,B", "1,2", "Option Content"
            const correctIndices = new Set<number>()
            const correctParts = correctRaw.split(/[,;]/).map((s: string) => s.trim())

            correctParts.forEach((part: string) => {
                if (!part) return
                // Try number (1-based)
                const num = parseInt(part)
                if (!isNaN(num) && num > 0 && num <= options.length) {
                    correctIndices.add(num - 1)
                    return
                }

                // Try Letter (A, B, C...)
                if (part.length === 1 && part.toUpperCase() >= 'A' && part.toUpperCase() <= 'Z') {
                    const index = part.toUpperCase().charCodeAt(0) - 65
                    if (index >= 0 && index < options.length) {
                        correctIndices.add(index)
                        return
                    }
                }

                // Try content match checking
                const matchIndex = options.findIndex((opt: string) => opt.toLowerCase() === part.toLowerCase())
                if (matchIndex >= 0) correctIndices.add(matchIndex)
            })

            if (options.length === 0) continue // Skip if no explanation? no options

            const answers = options.map((opt, idx) => ({
                content: opt,
                is_correct: correctIndices.has(idx),
                order_index: idx
            }))

            questions.push({
                question: {
                    content,
                    type,
                    explanation,
                    media_type,
                    media_url: mediaUrl,
                    order_index: i // maintain row order
                },
                answers
            })
        }

        setStats({ total: questions.length, valid: questions.length })
        setParsedData(questions)
        setIsLoading(false)
    }

    const handleImport = async () => {
        if (!parsedData || parsedData.length === 0) return

        setIsLoading(true)
        try {
            const res = await createQuestionsBatch(quizId, parsedData)
            if (res.success) {
                toast.success(`Đã nhập ${res.count} câu hỏi thành công!`)
                if (res.errors && res.errors.length > 0) {
                    toast.warning(`Có ${res.errors.length} lỗi xảy ra (xem console).`)
                    console.warn(res.errors)
                }
                setOpen(false)
                setParsedData(null)
                setStats(null)
            } else {
                toast.error("Có lỗi xảy ra khi nhập dữ liệu.")
            }
        } catch (e) {
            toast.error("Lỗi không xác định")
        } finally {
            setIsLoading(false)
        }
    }

    const downloadSample = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ["Câu hỏi", "Loại (single/multiple)", "Đáp án đúng", "Giải thích", "Loại Media (image/youtube)", "Link Media", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
            ["Thủ đô của Việt Nam là gì?", "single", "A", "Hà Nội là thủ đô ngàn năm văn hiến", "", "", "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ"],
            ["Đâu là số nguyên tố?", "multiple", "A,C", "2 và 3 là số nguyên tố", "image", "https://example.com/math.png", "2", "4", "3", "6"],
            ["1 + 1 = ?", "single", "2", "Toán học cơ bản", "youtube", "https://youtube.com/...", "1", "2", "3", "4"]
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Mau_Cau_Hoi")
        XLSX.writeFile(wb, "quiz_sample.xlsx")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Nhập Excel/CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Nhập câu hỏi từ file</DialogTitle>
                    <DialogDescription>
                        Hỗ trợ file Excel (.xlsx, .xls) hoặc CSV.
                        <br />
                        Định dạng: Câu hỏi | Loại | Đúng | Giải thích | Media Type | Media URL | Đáp án...
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex justify-end">
                        <div className="text-sm text-blue-600 hover:underline cursor-pointer flex items-center gap-1" onClick={downloadSample}>
                            <Upload className="h-3 w-3 rotate-180" /> Tải file mẫu
                        </div>
                    </div>
                    {!parsedData ? (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                            <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                disabled={isLoading}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer text-sm font-medium">
                                {isLoading ? "Đang đọc file..." : "Chọn file để tải lên"}
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-md border border-green-200 text-green-800 text-sm">
                                Đã tìm thấy <strong>{stats?.total}</strong> câu hỏi hợp lệ.
                            </div>
                            <Button className="w-full" onClick={handleImport} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Tiến hành nhập {stats?.total} câu hỏi
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => setParsedData(null)} disabled={isLoading}>
                                Chọn file khác
                            </Button>
                        </div>
                    )}
                    {isLoading && !parsedData && <div className="text-center text-xs text-muted-foreground">Đang xử lý...</div>}
                </div>
            </DialogContent>
        </Dialog>
    )
}
