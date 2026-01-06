'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Copy, Download, Upload, FileJson, Trash } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface JsonConverterProps {
    slug: string
    title: string
    description: string
}

export function JsonConverter({ slug, title, description }: JsonConverterProps) {
    const [inputContent, setInputContent] = useState<string>('')
    const [outputContent, setOutputContent] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string>('')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.match(/\.(json|txt)$/)) {
            toast.error('Vui lòng tải lên file JSON (.json, .txt)')
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
            const data = JSON.parse(content)
            const result = convertData(data, slug)
            setOutputContent(result)
            // toast.success('Chuyển đổi thành công!') // Too noisy for realtime
        } catch (error) {
            console.error(error)
            // Don't show error immediately on typing, maybe debounce or only on explicit action?
            // For now, only show valid status updates or assume invalid JSON
        } finally {
            setIsProcessing(false)
        }
    }

    const convertData = (data: any, slug: string): string => {
        const targetFormat = slug.replace('json-to-', '')

        // Ensure data is array for table-like formats
        const arrayData = Array.isArray(data) ? data : [data]

        switch (targetFormat) {
            case 'json':
                return JSON.stringify(data, null, 2)
            case 'jsonlines':
                return arrayData.map(row => JSON.stringify(row)).join('\n')
            case 'sql': {
                if (arrayData.length === 0) return ''
                const tableName = fileName.split('.')[0] || 'table_name'
                const columns = Object.keys(arrayData[0])
                const values = arrayData.map(row => {
                    const rowValues = columns.map(col => {
                        const val = row[col]
                        if (val === null) return 'NULL'
                        return typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val
                    })
                    return `(${rowValues.join(', ')})`
                }).join(',\n')
                return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values};`
            }
            case 'csv': {
                const worksheet = XLSX.utils.json_to_sheet(arrayData)
                return XLSX.utils.sheet_to_csv(worksheet)
            }
            case 'html': {
                const worksheet = XLSX.utils.json_to_sheet(arrayData)
                return XLSX.utils.sheet_to_html(worksheet)
            }
            case 'xml':
                return arrayData.map((row: any) => {
                    return `  <item>\n${Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join('\n')}\n  </item>`
                }).join('\n').replace(/^/, '<root>\n').replace(/$/, '\n</root>')

            case 'yaml':
                // Simple YAML implementation
                return arrayData.map((row: any) => {
                    return `- ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n  ')}`
                }).join('\n')

            case 'markdown': {
                const worksheet = XLSX.utils.json_to_sheet(arrayData)
                // XLSX doesn't support Markdown export directly, revert to manual
                if (arrayData.length === 0) return ''
                const headers = Object.keys(arrayData[0])
                const headerRow = `| ${headers.join(' | ')} |`
                const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`
                const rows = arrayData.map(row => `| ${headers.map(h => row[h] ?? '').join(' | ')} |`).join('\n')
                return `${headerRow}\n${separatorRow}\n${rows}`
            }
            case 'php':
                return `<?php\n$data = ` + JSON.stringify(data, null, 4)
                    .replace(/{/g, '[')
                    .replace(/}/g, ']')
                    .replace(/:/g, ' =>') +
                    `;\n?>`

            case 'ruby':
                return JSON.stringify(data, null, 2).replace(/"(\w+)":/g, ':$1 =>')

            // Fallback for others (ActionScript, ASP, etc.) - Just return stringified for now as placeholder
            // Enhancements can be made later for specific niche formats
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
        a.download = `converted.${slug.replace('json-to-', '')}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <ToolShell title={title} description={description} icon={FileJson}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Input JSON</CardTitle>
                        <CardDescription>
                            Nhập JSON trực tiếp hoặc tải file lên
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="json-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                <span>Upload File</span>
                                <input
                                    id="json-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".json, .txt"
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
                            placeholder='[{"id": 1, "name": "Test"}, ...]'
                            className="min-h-[200px] font-mono text-sm"
                            value={inputContent}
                            onChange={handleInputChange}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>2. Kết quả ({slug.replace('json-to-', '').toUpperCase()})</CardTitle>
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
