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
import TurndownService from 'turndown'

interface HtmlConverterProps {
    slug: string
    title: string
    description: string
}

export function HtmlConverter({ slug, title, description }: HtmlConverterProps) {
    const [inputContent, setInputContent] = useState<string>('')
    const [outputContent, setOutputContent] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string>('')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.match(/\.(html|htm|txt)$/)) {
            toast.error('Vui lòng tải lên file HTML (.html, .htm, .txt)')
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

    const parseHtmlTable = (html: string): any[] => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const table = doc.querySelector('table');

        if (!table) return [];

        const data: any[] = [];
        const headers: string[] = [];

        // Headers
        const ths = table.querySelectorAll('thead th, tr:first-child th, tr:first-child td');
        ths.forEach(th => headers.push(th.textContent?.trim() || ''));

        // If no headers found in thead or first row, fallback or error
        if (headers.length === 0) return [];

        // Rows
        const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
        rows.forEach(row => {
            const rowData: any = {};
            const cells = row.querySelectorAll('td');
            // If row has th, might be header row found in generic query, skip if matches headers
            if (row.querySelector('th')) return;

            cells.forEach((cell, index) => {
                if (headers[index]) {
                    rowData[headers[index]] = cell.textContent?.trim() || '';
                }
            });
            if (Object.keys(rowData).length > 0) {
                data.push(rowData);
            }
        });

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
        const targetFormat = slug.replace('html-to-', '')

        switch (targetFormat) {
            // Document Formats
            case 'markdown':
                const turndownService = new TurndownService();
                return turndownService.turndown(content);

            case 'html': // Beautify?
                // Simple naive formatter for now 
                // In future, generic Prettier or specialized lib
                return content; // Placeholder

            // Table Data Formats
            case 'json': {
                const data = parseHtmlTable(content);
                if (data.length === 0) return JSON.stringify({ error: "No HTML table found" });
                return JSON.stringify(data, null, 2);
            }
            case 'jsonlines': {
                const data = parseHtmlTable(content);
                return data.map(row => JSON.stringify(row)).join('\n');
            }
            case 'csv': {
                const data = parseHtmlTable(content);
                if (data.length === 0) return '';
                const worksheet = XLSX.utils.json_to_sheet(data);
                return XLSX.utils.sheet_to_csv(worksheet);
            }
            case 'sql': {
                const data = parseHtmlTable(content);
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
                const data = parseHtmlTable(content);
                if (data.length === 0) return '';
                return data.map(row => {
                    return `  <row>\n${Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join('\n')}\n  </row>`
                }).join('\n').replace(/^/, '<root>\n').replace(/$/, '\n</root>')
            }
            case 'yaml': {
                const data = parseHtmlTable(content);
                return data.map(row => {
                    return `- ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n  ')}`
                }).join('\n');
            }
            case 'excel': {
                // Not standard text output, but binary. We can't really display binary in textarea.
                // Maybe show message "Click download to get .xlsx file" or return base64 string?
                // For now, let's skip or return CSV-like representation
                return "For Excel file, please simply ensure this CSV preview looks correct, then we might strictly technically format as CSV which Excel opens. Real .xlsx download requires blob handling on button click logic update. \n\n" + convertData(content, 'html-to-csv');
            }


            // Fallbacks
            default:
                return `Conversion to ${targetFormat} from HTML not fully implemented yet for non-table data. \n\nRaw Content:\n${content}`
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
        a.download = `converted.${slug.replace('html-to-', '')}`
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
                        <CardTitle>1. Input HTML</CardTitle>
                        <CardDescription>
                            Nhập HTML trực tiếp hoặc tải file lên. <br />
                            <span className="text-muted-foreground italic text-xs">Đối với các định dạng dữ liệu (JSON, SQL, CSV...), công cụ sẽ tìm bản bảng (table) trong HTML.</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="html-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                <span>Upload File</span>
                                <input
                                    id="html-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".html, .htm, .txt"
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
                            placeholder={`<table>\n  <tr><th>ID</th><th>Name</th></tr>\n  <tr><td>1</td><td>John</td></tr>\n</table>`}
                            className="min-h-[200px] font-mono text-sm whitespace-pre"
                            value={inputContent}
                            onChange={handleInputChange}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>2. Kết quả ({slug.replace('html-to-', '').toUpperCase()})</CardTitle>
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
