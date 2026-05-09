'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Copy, Download, Upload, FileCode, Trash, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { recordsToCsv } from '@/lib/client/spreadsheet'
import { saveToolOutput } from '@/lib/client/tool-files'
import { loadMarked } from '@/lib/client/lazy-libraries'

interface MarkdownConverterProps {
    slug: string
    title: string
    description: string
}

export function MarkdownConverter({ slug, title, description }: MarkdownConverterProps) {
    const [inputContent, setInputContent] = useState<string>('')
    const [outputContent, setOutputContent] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string>('')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.match(/\.(md|markdown|txt)$/)) {
            toast.error('Vui lòng tải lên file Markdown (.md, .markdown, .txt)')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const result = e.target?.result as string
            setInputContent(result)
            setFileName(file.name)
            void processConversion(result)
        }
        reader.readAsText(file)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        setInputContent(value)
        if (value) void processConversion(value)
        else setOutputContent('')
    }

    const parseMarkdownTable = (markdown: string): any[] => {
        // Find the first markdown table
        const tableRegex = /\|(.+)\|\n\|([-:| ]+)\|\n((?:\|.+|\|\n)+)/;
        const match = markdown.match(tableRegex);

        if (!match) return [];

        const headerLine = match[1];
        const bodyLines = match[3].trim().split('\n');

        const headers = headerLine.split('|').map(h => h.trim()).filter(h => h !== '');

        const data = bodyLines.map(line => {
            const values = line.split('|').map(v => v.trim()).filter(v => v !== '');
            // Map values to headers
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            return row;
        });

        return data;
    };

    const processConversion = async (content: string) => {
        setIsProcessing(true)
        try {
            const result = await convertData(content, slug)
            setOutputContent(result)
        } catch (error) {
            console.error(error)
        } finally {
            setIsProcessing(false)
        }
    }

    const convertData = async (content: string, slug: string): Promise<string> => {
        const targetFormat = slug.replace('markdown-to-', '')

        switch (targetFormat) {
            // Document Formats
            case 'html': {
                const { marked } = await loadMarked()
                return (await marked.parse(content)) as string
            }

            case 'markdown':
                // Already markdown, maybe beautify?
                // For now just return as is or use a formatter if available.
                return content;

            // Table Data Formats
            case 'json': {
                const data = parseMarkdownTable(content);
                if (data.length === 0) return JSON.stringify({ error: "No markdown table found" });
                return JSON.stringify(data, null, 2);
            }
            case 'jsonlines': {
                const data = parseMarkdownTable(content);
                return data.map(row => JSON.stringify(row)).join('\n');
            }
            case 'csv': {
                const data = parseMarkdownTable(content);
                if (data.length === 0) return '';
                return recordsToCsv(data);
            }
            case 'sql': {
                const data = parseMarkdownTable(content);
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
                const data = parseMarkdownTable(content);
                if (data.length === 0) return '';
                return data.map(row => {
                    return `  <row>\n${Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join('\n')}\n  </row>`
                }).join('\n').replace(/^/, '<root>\n').replace(/$/, '\n</root>')
            }
            case 'yaml': {
                const data = parseMarkdownTable(content);
                return data.map(row => {
                    return `- ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n  ')}`
                }).join('\n');
            }

            // Fallbacks for other formats or document conversions
            default:
                // Attempts to use marked for text based conversions or return raw
                return `Conversion to ${targetFormat} not fully implemented yet for non-table data. \n\nRaw Content:\n${content}`
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(outputContent)
        toast.success('Đã sao chép vào clipboard')
    }

    const downloadResult = async () => {
        const filename = `converted.${slug.replace('markdown-to-', '')}`
        const blob = new Blob([outputContent], { type: 'text/plain' })
        await saveToolOutput({ moduleKey: slug, blob, filename, mimeType: 'text/plain' })
    }

    return (
        <ToolShell title={title} description={description} icon={FileCode}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Input Markdown</CardTitle>
                        <CardDescription>
                            Nhập Markdown trực tiếp hoặc tải file lên. <br />
                            <span className="text-muted-foreground italic text-xs">Đối với các định dạng dữ liệu (JSON, SQL, CSV...), công cụ sẽ tìm bản bảng trong markdown.</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="md-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                <span>Upload File</span>
                                <input
                                    id="md-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".md, .markdown, .txt"
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
                            placeholder={`# Hello\n\n| ID | Name |\n|---|---|\n| 1 | John |`}
                            className="min-h-[200px] font-mono text-sm whitespace-pre"
                            value={inputContent}
                            onChange={handleInputChange}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>2. Kết quả ({slug.replace('markdown-to-', '').toUpperCase()})</CardTitle>
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
