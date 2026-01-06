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

interface SqlConverterProps {
    slug: string
    title: string
    description: string
}

export function SqlConverter({ slug, title, description }: SqlConverterProps) {
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

    // Basic SQL INSERT parser
    // Limitation: Handles simple "INSERT INTO table (cols) VALUES (vals), (vals)...;"
    const parseSqlInsert = (sql: string): any[] => {
        // Remove comments
        const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();

        // Regex to find INSERT statement parts
        // MATCH: INSERT INTO [table] (col1, col2) VALUES ...
        const insertRegex = /INSERT\s+INTO\s+[`"']?(\w+)[`"']?\s*\(([^)]+)\)\s*VALUES\s*/i;
        const match = cleanSql.match(insertRegex);

        if (!match) return [];

        const columns = match[2].split(',').map(c => c.trim().replace(/[`"']/g, ''));
        const valuesPart = cleanSql.substring(match.index! + match[0].length);

        // Split values groups: (val1, val2), (val3, val4)...
        // This is tricky with commas inside strings. 
        // Simple state machine parser for values
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
                    // Check for escape (e.g. 'O''Neil' or 'O\'Neil')
                    if (valuesPart[i + 1] === stringChar) {
                        currentValue += stringChar;
                        i++; // skip next
                    } else if (char === "'" && valuesPart[i - 1] === "\\") {
                        // Backslash escaped? Standard SQL uses double single quote, but MySQL might use backslash
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
                // Finish last value
                if (columns[colIndex]) {
                    currentRow[columns[colIndex]] = parseValue(currentValue);
                }
                rows.push(currentRow);
                currentValue = '';
                continue;
            }

            if (char === ',' && inGroup) {
                // Finish current value
                if (columns[colIndex]) {
                    currentRow[columns[colIndex]] = parseValue(currentValue);
                }
                colIndex++;
                currentValue = '';
                continue;
            }

            if (char === "'" || char === '"') {
                inGroup = true; // Safety
                inString = true;
                stringChar = char;
                continue;
            }

            if (inGroup && char !== '\n' && char !== '\r') {
                currentValue += char;
            }

            if (char === ';') break; // End of statement
        }

        return rows;
    };

    const parseValue = (val: string): any => {
        const v = val.trim();
        if (v.toUpperCase() === 'NULL') return null;
        if (!isNaN(Number(v)) && v !== '') return Number(v);
        return v; // Return string (quotes already stripped by logic above if handled perfectly, but here we accumulated content inside quotes, wait.. regex logic was accumulating inside quotes.
        // My manual parser accumulated EVERYTHING inside quotes purely.
        // But for numbers/nulls it accumulated characters. 
        // Logic fix: The currentValue accumulator didn't distinguishing between quoted string content and raw values (NULL, 123) correctly in the loop above?
        // Actually: 
        //  if (char === "'" || char === '"') -> inString = true.
        //  while inString -> currentValue += char.
        // So currentValue contains the raw string Content WITHOUT quotes? Yes.
        // But what about numbers?
        //  if (inGroup && char !== ...) -> currentValue += char.
        // So numbers 123 are captured. 'abc' is captured as abc.
        // So `parseValue` mostly needs to handle type casting.
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
        const targetFormat = slug.replace('sql-to-', '')

        switch (targetFormat) {
            case 'sql':
                // Format/Beautify (Simple)
                return content; // Placeholder, or use library

            // Table Data Formats
            case 'json': {
                const data = parseSqlInsert(content);
                if (data.length === 0) return JSON.stringify({ error: "No robust INSERT statements found or parser limitation." });
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

            // Fallback
            default:
                return `Conversion to ${targetFormat} from SQL not fully implemented yet for non-table data. \n\nRaw Content:\n${content}`
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
        a.download = `converted.${slug.replace('sql-to-', '')}`
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
                        <CardTitle>1. Input SQL</CardTitle>
                        <CardDescription>
                            Nhập câu lệnh `INSERT INTO` SQL hoặc tải file .sql. <br />
                            <span className="text-muted-foreground italic text-xs">Hỗ trợ các câu lệnh dạng: `INSERT INTO table (col1, col2) VALUES (val1, val2), ...;`</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="sql-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                <span>Upload File</span>
                                <input
                                    id="sql-upload"
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
                            <CardTitle>2. Kết quả ({slug.replace('sql-to-', '').toUpperCase()})</CardTitle>
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
