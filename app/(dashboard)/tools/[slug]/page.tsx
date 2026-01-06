import { notFound } from 'next/navigation'
import { modules } from '@/config/modules'
import { ExcelConverter } from '@/components/tools/ExcelConverter'
import { JsonConverter } from '@/components/tools/JsonConverter'
import { CsvConverter } from '@/components/tools/CsvConverter'
import { MarkdownConverter } from '@/components/tools/MarkdownConverter'
import { HtmlConverter } from '@/components/tools/HtmlConverter'
import { SqlConverter } from '@/components/tools/SqlConverter'
import { LatexConverter } from '@/components/tools/LatexConverter'
import { XmlConverter } from '@/components/tools/XmlConverter'
import { MysqlConverter } from '@/components/tools/MysqlConverter'
import { MediawikiConverter } from '@/components/tools/MediawikiConverter'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function ToolPage({ params }: PageProps) {
    const { slug } = await params

    // Find module definition
    const module = modules.find(m => m.key === slug)

    // If not found, return 404
    if (!module) {
        notFound()
    }

    if (module.key.startsWith('excel-to-')) {
        return (
            <ExcelConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key.startsWith('json-to-')) {
        return (
            <JsonConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key.startsWith('csv-to-')) {
        return (
            <CsvConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key.startsWith('markdown-to-')) {
        return (
            <MarkdownConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key.startsWith('html-to-')) {
        return (
            <HtmlConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key.startsWith('sql-to-')) {
        return (
            <SqlConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key.startsWith('latex-to-')) {
        return (
            <LatexConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key.startsWith('xml-to-')) {
        return (
            <XmlConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key.startsWith('mysql-to-')) {
        return (
            <MysqlConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key.startsWith('mediawiki-to-')) {
        return (
            <MediawikiConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key === 'merge-pdf') {
        const { MergePDF } = await import('@/components/tools/pdf/MergePDF') // Dynamic import to avoid heavy bundle if not used
        return (
            <MergePDF
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key === 'split-pdf') {
        const { SplitPDF } = await import('@/components/tools/pdf/SplitPDF')
        return (
            <SplitPDF
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key === 'pdf-to-image') {
        const { PDFToImage } = await import('@/components/tools/pdf/PDFToImage')
        return (
            <PDFToImage
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key === 'image-to-pdf') {
        const { ImageToPDF } = await import('@/components/tools/pdf/ImageToPDF')
        return (
            <ImageToPDF
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    return notFound()
}

export function generateStaticParams() {
    return modules
        .filter(m => [
            'Table',
            'JSON',
            'CSV',
            'Markdown',
            'HTML',
            'SQL',
            'LaTeX',
            'XML',
            'MySQL',
            'MediaWiki',
            'PDF'
        ].includes(m.category))
        .map(m => ({
            slug: m.key
        }))
}
