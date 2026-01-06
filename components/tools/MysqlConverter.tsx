'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Copy, Download, Upload, Database, Trash } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface MysqlConverterProps {
    slug: string
    title: string
    description: string
}

export function MysqlConverter({ slug, title, description }: MysqlConverterProps) {
    const [inputContent, setInputContent] = useState<string>('')
    const [outputContent, setOutputContent] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string>('')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.match(/\.(sql|txt)$/)) {
            toast.error('Vui lòng tải lên file SQL (.sql, .txt)')
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

    // Reuse SQL parser logic from SqlConverter for now
    const parseSqlInsert = (sql: string): any[] => {
        const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
        const insertRegex = /INSERT\s+INTO\s+[`"']?(\w+)[`"']?\s*\(([^)]+)\)\s*VALUES\s*/i;
        const match = cleanSql.match(insertRegex);

        if (!match) return [];

        const columns = match[2].split(',').map(c => c.trim().replace(/[`"']/g, ''));
        const valuesPart = cleanSql.substring(match.index! + match[0].length);

        const rows: any[] = [];
        let currentRow: any = {};
        let colIndex = 0;
        let inString = false;
        let stringChar = '';
        let inGroup = false;
        let currentValue = '';

        for (let i = 0; i < valuesPart.length; i++) {
            const char = valuesPart[i];

            if (inString) {
                if (char === stringChar) {
                    if (valuesPart[i + 1] === stringChar) {
                        currentValue += stringChar;
                        i++;
                    } else if (char === "'" && valuesPart[i - 1] === "\\") {
                        currentValue += char;
                    } else {
                        inString = false;
                    }
                } else {
                    currentValue += char;
                }
                continue;
            }

            if (char === '(' && !inGroup) {
                inGroup = true;
                colIndex = 0;
                currentRow = {};
                continue;
            }

            if (char === ')' && inGroup) {
                inGroup = false;
                if (columns[colIndex]) {
                    currentRow[columns[colIndex]] = parseValue(currentValue);
                }
                rows.push(currentRow);
                currentValue = '';
                continue;
            }

            if (char === ',' && inGroup) {
                if (columns[colIndex]) {
                    currentRow[columns[colIndex]] = parseValue(currentValue);
                }
                colIndex++;
                currentValue = '';
                continue;
            }

            if (char === "'" || char === '"') {
                inGroup = true;
                inString = true;
                stringChar = char;
                continue;
            }

            if (inGroup && char !== '\n' && char !== '\r') {
                currentValue += char;
            }

            if (char === ';') break;
        }

        return rows;
    };

    const parseValue = (val: string): any => {
        const v = val.trim();
        if (v.toUpperCase() === 'NULL') return null;
        if (!isNaN(Number(v)) && v !== '') return Number(v);
        return v;
    }


    const processConversion = (content: string) => {
        setIsProcessing(true)
        try {
            const result = convertData(content, slug)
            setOutputContent(result)
        } catch (error) {
            console.error(error)
        } finally {
            setIsProcessing(false)
        }
    }

    const convertData = (content: string, slug: string): string => {
        const targetFormat = slug.replace('mysql-to-', '')

        switch (targetFormat) {
            case 'mysql':
            case 'sql':
                return content;

            case 'json': {
                const data = parseSqlInsert(content);
                if (data.length === 0) return JSON.stringify({ error: "No robust INSERT statements found" });
                return JSON.stringify(data, null, 2);
            }
            case 'jsonlines': {
                const data = parseSqlInsert(content);
                return data.map(row => JSON.stringify(row)).join('\n');
            }
            case 'csv': {
                const data = parseSqlInsert(content);
                if (data.length === 0) return '';
                const worksheet = XLSX.utils.json_to_sheet(data);
                return XLSX.utils.sheet_to_csv(worksheet);
            }
            case 'xml': {
                const data = parseSqlInsert(content);
                if (data.length === 0) return '';
                return data.map(row => {
                    return `  <row>\n${Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join('\n')}\n  </row>`
                }).join('\n').replace(/^/, '<root>\n').replace(/$/, '\n</root>')
            }
            case 'yaml': {
                const data = parseSqlInsert(content);
                return data.map(row => {
                    return `- ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n  ')}`
                }).join('\n');
            }

            default:
                return `Conversion to ${targetFormat} from MySQL not fully implemented yet for non-table data. \n\nRaw Content:\n${content}`
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
        a.download = `converted.${slug.replace('mysql-to-', '')}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <ToolShell title={title} description={description} icon={Database}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Input MySQL</CardTitle>
                        <CardDescription>
                            Nhập câu lệnh `INSERT INTO` MySQL hoặc tải file .sql.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="mysql-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                <span>Upload File</span>
                                <input
                                    id="mysql-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".sql, .txt"
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
                            placeholder={`INSERT INTO users (id, name)\nVALUES (1, 'John'), (2, 'Jane');`}
                            className="min-h-[200px] font-mono text-sm whitespace-pre"
                            value={inputContent}
                            onChange={handleInputChange}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>2. Kết quả ({slug.replace('mysql-to-', '').toUpperCase()})</CardTitle>
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
