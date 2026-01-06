'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Copy, Download, Upload, FileCode, Trash } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface LatexConverterProps {
    slug: string
    title: string
    description: string
}

export function LatexConverter({ slug, title, description }: LatexConverterProps) {
    const [inputContent, setInputContent] = useState<string>('')
    const [outputContent, setOutputContent] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string>('')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.match(/\.(tex|latex|txt)$/)) {
            toast.error('Vui lòng tải lên file LaTeX (.tex, .latex)')
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

    const parseLatexTable = (latex: string): any[] => {
        // Find tabular environment
        // \begin{tabular}{...} ... \end{tabular}
        const tabularRegex = /\\begin\{tabular\}\{[^}]+\}([\s\S]*?)\\end\{tabular\}/;
        const match = latex.match(tabularRegex);

        if (!match) return [];

        const body = match[1].trim();
        const rows = body.split('\\\\').map(row => row.trim()).filter(row => row && !row.startsWith('\\hline'));

        if (rows.length === 0) return [];

        // Assume first row is header
        const headerRow = rows[0];
        const headers = headerRow.split('&').map(h => h.trim().replace(/\\textbf\{([^}]+)\}/, '$1'));

        const data = [];
        for (let i = 1; i < rows.length; i++) {
            const rowStr = rows[i];
            const cols = rowStr.split('&').map(c => c.trim());
            const rowData: any = {};

            headers.forEach((header, idx) => {
                if (header) {
                    rowData[header] = cols[idx] || '';
                }
            });

            // Basic filtering of empty rows
            if (Object.keys(rowData).length > 0) {
                data.push(rowData);
            }
        }

        return data;
    };

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
        const targetFormat = slug.replace('latex-to-', '')

        switch (targetFormat) {
            case 'latex':
                return content; // Formatter?

            // Table Data Formats
            case 'json': {
                const data = parseLatexTable(content);
                if (data.length === 0) return JSON.stringify({ error: "No LaTeX table found" });
                return JSON.stringify(data, null, 2);
            }
            case 'jsonlines': {
                const data = parseLatexTable(content);
                return data.map(row => JSON.stringify(row)).join('\n');
            }
            case 'csv': {
                const data = parseLatexTable(content);
                if (data.length === 0) return '';
                const worksheet = XLSX.utils.json_to_sheet(data);
                return XLSX.utils.sheet_to_csv(worksheet);
            }
            case 'sql': {
                const data = parseLatexTable(content);
                if (data.length === 0) return '-- No table found';
                const tableName = fileName.split('.')[0] || 'table_name';
                const columns = Object.keys(data[0]);
                const values = data.map(row => {
                    const rowValues = columns.map(col => {
                        const val = row[col];
                        return typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;
                    });
                    return `(${rowValues.join(', ')})`;
                }).join(',\n');
                return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values};`;
            }
            case 'xml': {
                const data = parseLatexTable(content);
                if (data.length === 0) return '';
                return data.map(row => {
                    return `  <row>\n${Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join('\n')}\n  </row>`
                }).join('\n').replace(/^/, '<root>\n').replace(/$/, '\n</root>')
            }
            case 'yaml': {
                const data = parseLatexTable(content);
                return data.map(row => {
                    return `- ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n  ')}`
                }).join('\n');
            }

            default:
                return `Conversion to ${targetFormat} from LaTeX not fully implemented yet for non-table data. \n\nRaw Content:\n${content}`
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
        a.download = `converted.${slug.replace('latex-to-', '')}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <ToolShell title={title} description={description} icon={FileCode}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Input LaTeX</CardTitle>
                        <CardDescription>
                            Nhập mã LaTeX hoặc tải file .tex. <br />
                            <span className="text-muted-foreground italic text-xs">Hỗ trợ môi trường `tabular` cơ bản.</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="latex-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                <span>Upload File</span>
                                <input
                                    id="latex-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".tex, .latex, .txt"
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
                            placeholder={`\\begin{tabular}{ |c|c| } \n \\hline \n ID & Name \\\\ \n 1 & John \\\\ \n \\hline \n\\end{tabular}`}
                            className="min-h-[200px] font-mono text-sm whitespace-pre"
                            value={inputContent}
                            onChange={handleInputChange}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>2. Kết quả ({slug.replace('latex-to-', '').toUpperCase()})</CardTitle>
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
