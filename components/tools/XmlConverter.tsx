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

interface XmlConverterProps {
    slug: string
    title: string
    description: string
}

export function XmlConverter({ slug, title, description }: XmlConverterProps) {
    const [inputContent, setInputContent] = useState<string>('')
    const [outputContent, setOutputContent] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string>('')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.match(/\.(xml|txt)$/)) {
            toast.error('Vui lòng tải lên file XML (.xml)')
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

    const parseXmlTable = (xml: string): any[] => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, 'application/xml');

            // Heuristic to find the "table" or list of items
            // Find an element that has children with same tag names
            const root = doc.documentElement;
            if (!root) return [];

            // If root has direct children that look like rows
            let rows = Array.from(root.children);

            // If only 1 child, maybe nested? <root><dataset><row>...</row><row>...</row></dataset></root>
            if (rows.length === 1 && rows[0].children.length > 1) {
                // Check if those children are homogenous
                rows = Array.from(rows[0].children)
            }

            if (rows.length === 0) return [];

            const data = rows.map(row => {
                const rowData: any = {};
                const cells = Array.from(row.children);
                cells.forEach(cell => {
                    rowData[cell.tagName] = cell.textContent || '';
                });
                return rowData;
            });

            return data;
        } catch (e) {
            console.error("XML Parse Error", e);
            return [];
        }
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
        const targetFormat = slug.replace('xml-to-', '')

        switch (targetFormat) {
            case 'xml':
                return content; // Formatter?

            // Table Data Formats
            case 'json': {
                const data = parseXmlTable(content);
                if (data.length === 0) return JSON.stringify({ error: "No structured XML data found" });
                return JSON.stringify(data, null, 2);
            }
            case 'jsonlines': {
                const data = parseXmlTable(content);
                return data.map(row => JSON.stringify(row)).join('\n');
            }
            case 'csv': {
                const data = parseXmlTable(content);
                if (data.length === 0) return '';
                const worksheet = XLSX.utils.json_to_sheet(data);
                return XLSX.utils.sheet_to_csv(worksheet);
            }
            case 'sql': {
                const data = parseXmlTable(content);
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
            case 'yaml': {
                const data = parseXmlTable(content);
                return data.map(row => {
                    return `- ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n  ')}`
                }).join('\n');
            }

            default:
                return `Conversion to ${targetFormat} from XML not fully implemented yet for non-table data. \n\nRaw Content:\n${content}`
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
        a.download = `converted.${slug.replace('xml-to-', '')}`
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
                        <CardTitle>1. Input XML</CardTitle>
                        <CardDescription>
                            Nhập mã XML hoặc tải file .xml. <br />
                            <span className="text-muted-foreground italic text-xs">Hỗ trợ cấu trúc dạng `&lt;root&gt;&lt;row&gt;&lt;col&gt;val&lt;/col&gt;&lt;/row&gt;...`</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="xml-upload"
                                className="flex items-center justify-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                <span>Upload File</span>
                                <input
                                    id="xml-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".xml, .txt"
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
                            placeholder={`<users>\n  <user>\n    <id>1</id>\n    <name>John</name>\n  </user>\n</users>`}
                            className="min-h-[200px] font-mono text-sm whitespace-pre"
                            value={inputContent}
                            onChange={handleInputChange}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>2. Kết quả ({slug.replace('xml-to-', '').toUpperCase()})</CardTitle>
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
