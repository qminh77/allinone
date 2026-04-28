'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Copy, Download, Upload, FileSpreadsheet, FileWarning } from 'lucide-react'
import { toast } from 'sonner'
import { readSpreadsheetRows, recordsToHtmlTable, rowsToCsv, rowsToRecords, type TableRow } from '@/lib/client/spreadsheet'

interface ExcelConverterProps {
    slug: string
    title: string
    description: string
}

export function ExcelConverter({ slug, title, description }: ExcelConverterProps) {
    const [inputContent, setInputContent] = useState<string>('')
    const [outputContent, setOutputContent] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string>('')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.match(/\.(xlsx|csv)$/i)) {
            toast.error('Vui lòng tải lên file Excel (.xlsx) hoặc CSV')
            return
        }

        setIsProcessing(true)
        setFileName(file.name)

        try {
            const rows = await readSpreadsheetRows(file)
            const jsonData = rowsToRecords(rows)

            // Process based on slug
            const result = convertData(jsonData, slug, rows)
            setOutputContent(result)
            toast.success('Chuyển đổi thành công!')
        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra khi đọc file!')
        } finally {
            setIsProcessing(false)
        }
    }

    const convertData = (data: any[], slug: string, tableRows: TableRow[]): string => {
        const targetFormat = slug.replace('excel-to-', '')

        switch (targetFormat) {
            case 'json':
                return JSON.stringify(data, null, 2)
            case 'jsonlines':
                return data.map(row => JSON.stringify(row)).join('\n')
            case 'sql':
                if (data.length === 0) return ''
                const tableName = fileName.split('.')[0] || 'table_name'
                const columns = Object.keys(data[0])
                const values = data.map(row => {
                    const rowValues = columns.map(col => {
                        const val = row[col]
                        if (val === null || val === undefined) return 'NULL'
                        return typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val
                    })
                    return `(${rowValues.join(', ')})`
                }).join(',\n')
                return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values};`
            case 'csv':
                return rowsToCsv(tableRows)
            case 'html':
                return recordsToHtmlTable(data)
            case 'xml':
                return data.map(row => {
                    return `  <row>\n${Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join('\n')}\n  </row>`
                }).join('\n').replace(/^/, '<root>\n').replace(/$/, '\n</root>')
            case 'yaml':
                // Simple YAML implementation
                return data.map(row => {
                    return `- ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n  ')}`
                }).join('\n')
            case 'markdown':
                // Simple Markdown Table
                if (data.length === 0) return ''
                const headers = Object.keys(data[0])
                const headerRow = `| ${headers.join(' | ')} |`
                const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`
                const rows = data.map(row => `| ${headers.map(h => row[h] ?? '').join(' | ')} |`).join('\n')
                return `${headerRow}\n${separatorRow}\n${rows}`

            case 'php':
                // PHP Array
                return `<?php\n$data = ` + JSON.stringify(data, null, 4)
                    .replace(/{/g, '[')
                    .replace(/}/g, ']')
                    .replace(/:/g, ' =>') +
                    `;\n?>`

            case 'ruby':
                // Ruby Array/Hash
                return JSON.stringify(data, null, 2).replace(/"(\w+)":/g, ':$1 =>')

            // Add more cases as needed or generic fallback
            default:
                return JSON.stringify(data, null, 2) // Default to JSON for now
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(outputContent)
        toast.success('Đã sao chép vào clipboard')
    }

    const downloadResult = () => {
        const blob = new Blob([outputContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `converted.${slug.replace('excel-to-', '')}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <ToolShell title={title} description={description} icon={FileSpreadsheet}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Tải lên file Excel</CardTitle>
                        <CardDescription>
                            Chấp nhận định dạng .xlsx, .csv
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center w-full">
                            <Label
                                htmlFor="dropzone-file"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Click để tải lên</span> hoặc kéo thả
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        XLSX hoặc CSV (MAX. 10MB)
                                    </p>
                                </div>
                                <input
                                    id="dropzone-file"
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx, .csv"
                                    onChange={handleFileUpload}
                                />
                            </Label>
                        </div>
                        {fileName && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                                <FileSpreadsheet className="w-4 h-4" />
                                <span>Đã chọn: {fileName}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>2. Kết quả ({slug.replace('excel-to-', '').toUpperCase()})</CardTitle>
                            <CardDescription>
                                Xem trước và tải xuống kết quả
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!outputContent}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                            </Button>
                            <Button size="sm" onClick={downloadResult} disabled={!outputContent}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Kết quả chuyển đổi sẽ xuất hiện ở đây..."
                            className="min-h-[300px] font-mono text-sm"
                            value={outputContent}
                            readOnly
                        />
                    </CardContent>
                </Card>
            </div>
        </ToolShell>
    )
}
