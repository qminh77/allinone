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

interface MediawikiConverterProps {
    slug: string
    title: string
    description: string
}

export function MediawikiConverter({ slug, title, description }: MediawikiConverterProps) {
    const [inputContent, setInputContent] = useState<string>('')
    const [outputContent, setOutputContent] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string>('')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.match(/\.(wiki|txt)$/)) {
            toast.error('Vui lòng tải lên file MediaWiki (.wiki, .txt)')
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

    const parseMediaWikiTable = (wiki: string): any[] => {
        // Regex to find table: {| ... |}
        const tableRegex = /\{\|[\s\S]*?\|\}/;
        const match = wiki.match(tableRegex);

        if (!match) return [];

        const tableContent = match[0];
        // Split by rows |-
        const rows = tableContent.split('|-');

        // Filter out table start/end artifacts and empty strings
        const cleanRows = rows.map(r => r.replace(/^\{\|.*$/m, '').replace(/^\|\}.*$/m, '').trim()).filter(r => r);

        if (cleanRows.length === 0) return [];

        // Assume first row is header if distinct, or just process
        // MediaWiki headers often start with !
        // Cells start with |

        const parseRow = (rowStr: string) => {
            // Split by | or !! (for single line headers) or || (for single line cells)
            // Simple approach: split by newline first? 
            // Mediawiki allows:
            // | Cell 1 || Cell 2
            // or
            // | Cell 1
            // | Cell 2

            // Normalize to newlines
            const normalized = rowStr.replace(/\|\|/g, '\n|').replace(/!!/g, '\n!');
            return normalized.split('\n').filter(l => l.startsWith('|') || l.startsWith('!')).map(l => l.substring(1).trim());
        };

        const parsedRows = cleanRows.map(parseRow);

        if (parsedRows.length === 0) return [];

        const headers = parsedRows[0]; // Assuming first row is header
        const data = [];

        for (let i = 1; i < parsedRows.length; i++) {
            const cells = parsedRows[i];
            const rowData: any = {};

            headers.forEach((h, idx) => {
                rowData[h] = cells[idx] || '';
            });

            // Basic filtering
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
        const targetFormat = slug.replace('mediawiki-to-', '')

        switch (targetFormat) {
            case 'mediawiki':
                return content;

            // Table Data Formats
            case 'json': {
                const data = parseMediaWikiTable(content);
                if (data.length === 0) return JSON.stringify({ error: "No MediaWiki table found" });
                return JSON.stringify(data, null, 2);
            }
            case 'jsonlines': {
                const data = parseMediaWikiTable(content);
                return data.map(row => JSON.stringify(row)).join('\n');
            }
            case 'csv': {
                const data = parseMediaWikiTable(content);
                if (data.length === 0) return '';
                const worksheet = XLSX.utils.json_to_sheet(data);
                return XLSX.utils.sheet_to_csv(worksheet);
            }
            case 'sql': {
                const data = parseMediaWikiTable(content);
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
                const data = parseMediaWikiTable(content);
                if (data.length === 0) return '';
                return data.map(row => {
                    return `  <row>\n${Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join('\n')}\n  </row>`
                }).join('\n').replace(/^/, '<root>\n').replace(/$/, '\n</root>')
            }
            case 'yaml': {
                const data = parseMediaWikiTable(content);
                return data.map(row => {
                    return `- ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n  ')}`
                }).join('\n');
            }

            default:
                return `Conversion to ${targetFormat} from MediaWiki not fully implemented yet for non-table data. \n\nRaw Content:\n${content}`
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
        a.download = `converted.${slug.replace('mediawiki-to-', '')}`
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
                        <CardTitle>1. Input MediaWiki</CardTitle>
                        <CardDescription>
                            Nhập mã MediaWiki hoặc tải file .wiki. <br />
                            <span className="text-muted-foreground italic text-xs">Hỗ trợ bảng `&#123;| ... |&#125;` cơ bản.</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="wiki-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                <span>Upload File</span>
                                <input
                                    id="wiki-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".wiki, .txt"
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
                            placeholder={`{| class="wikitable"\n|-\n! Header 1 !! Header 2\n|-\n| Row 1 Col 1 || Row 1 Col 2\n|}`}
                            className="min-h-[200px] font-mono text-sm whitespace-pre"
                            value={inputContent}
                            onChange={handleInputChange}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>2. Kết quả ({slug.replace('mediawiki-to-', '').toUpperCase()})</CardTitle>
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
