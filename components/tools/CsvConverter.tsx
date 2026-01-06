'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Copy, Download, Upload, FileSpreadsheet, Trash } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface CsvConverterProps {
    slug: string
    title: string
    description: string
}

export function CsvConverter({ slug, title, description }: CsvConverterProps) {
    const [inputContent, setInputContent] = useState<string>('')
    const [outputContent, setOutputContent] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string>('')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.match(/\.(csv|txt)$/)) {
            toast.error('Vui lòng tải lên file CSV (.csv, .txt)')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const result = e.target?.result as string
            setInputContent(result)
            setFileName(file.name)
            processConversion(result)
        }
        reader.readAsText(file)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        setInputContent(value)
        if (value) processConversion(value)
        else setOutputContent('')
    }

    const processConversion = (content: string) => {
        setIsProcessing(true)
        try {
            // Use XLSX to parse CSV string for robustness
            const workbook = XLSX.read(content, { type: 'string' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)

            const result = convertData(jsonData, slug, worksheet)
            setOutputContent(result)
        } catch (error) {
            console.error(error)
            // Silent fail or minimal error
        } finally {
            setIsProcessing(false)
        }
    }

    const convertData = (data: any[], slug: string, worksheet: XLSX.WorkSheet): string => {
        const targetFormat = slug.replace('csv-to-', '')

        switch (targetFormat) {
            case 'json':
                return JSON.stringify(data, null, 2)
            case 'jsonlines':
                return data.map(row => JSON.stringify(row)).join('\n')
            case 'sql': {
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
            }
            case 'csv':
                // Re-formatting/cleaning
                return XLSX.utils.sheet_to_csv(worksheet)
            case 'html':
                return XLSX.utils.sheet_to_html(worksheet)
            case 'xml':
                return data.map(row => {
                    return `  <row>\n${Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join('\n')}\n  </row>`
                }).join('\n').replace(/^/, '<root>\n').replace(/$/, '\n</root>')

            case 'yaml':
                return data.map(row => {
                    return `- ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n  ')}`
                }).join('\n')

            case 'markdown':
                if (data.length === 0) return ''
                const headers = Object.keys(data[0])
                const headerRow = `| ${headers.join(' | ')} |`
                const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`
                const rows = data.map(row => `| ${headers.map(h => row[h] ?? '').join(' | ')} |`).join('\n')
                return `${headerRow}\n${separatorRow}\n${rows}`

            case 'php':
                return `<?php\n$data = ` + JSON.stringify(data, null, 4)
                    .replace(/{/g, '[')
                    .replace(/}/g, ']')
                    .replace(/:/g, ' =>') +
                    `;\n?>`

            case 'ruby':
                return JSON.stringify(data, null, 2).replace(/"(\w+)":/g, ':$1 =>')

            default:
                return JSON.stringify(data, null, 2)
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
        a.download = `converted.${slug.replace('csv-to-', '')}`
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
                        <CardTitle>1. Input CSV</CardTitle>
                        <CardDescription>
                            Nhập CSV trực tiếp hoặc tải file lên
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="csv-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                <span>Upload File</span>
                                <input
                                    id="csv-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".csv, .txt"
                                    onChange={handleFileUpload}
                                />
                            </Label>
                            {fileName && <span className="text-sm text-green-600">File: {fileName}</span>}
                            <Button variant="ghost" size="sm" onClick={() => { setInputContent(''); setFileName(''); setOutputContent('') }}>
                                <Trash className="w-4 h-4 mr-2" />
                                Clear
                            </Button>
                        </div>
                        <Textarea
                            placeholder={`id,name,age\n1,John,30\n2,Jane,25`}
                            className="min-h-[200px] font-mono text-sm whitespace-pre"
                            value={inputContent}
                            onChange={handleInputChange}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>2. Kết quả ({slug.replace('csv-to-', '').toUpperCase()})</CardTitle>
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
