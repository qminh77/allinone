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

    if (module.key === 'rotate-pdf') {
        const { RotatePDF } = await import('@/components/tools/pdf/RotatePDF')
        return (
            <RotatePDF
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key === 'protect-pdf') {
        const { ProtectPDF } = await import('@/components/tools/pdf/ProtectPDF')
        return (
            <ProtectPDF
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key === 'unlock-pdf') {
        const { UnlockPDF } = await import('@/components/tools/pdf/UnlockPDF')
        return (
            <UnlockPDF
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }


    if (['webp-to-png', 'jfif-to-png', 'webp-to-jpg', 'svg-converter'].includes(module.key)) {
        const { GeneralImageConverter } = await import('@/components/tools/image/GeneralImageConverter')
        return (
            <GeneralImageConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (['heic-to-jpg', 'heic-to-png'].includes(module.key)) {
        const { HeicConverter } = await import('@/components/tools/image/HeicConverter')
        return (
            <HeicConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.key === 'png-to-svg') {
        const { SvgVectorConverter } = await import('@/components/tools/image/SvgVectorConverter')
        return (
            <SvgVectorConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.category === 'Audio') {
        const { UniversalAudioConverter } = await import('@/components/tools/audio/UniversalAudioConverter')
        return (
            <UniversalAudioConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    if (module.category === 'Font') {
        const { UniversalFontConverter } = await import('@/components/tools/font/UniversalFontConverter')
        return (
            <UniversalFontConverter
                slug={module.key}
                title={module.name}
                description={module.description}
            />
        )
    }

    // Existing catch-all for converters
    if (module.key.endsWith('-converter') && module.key !== 'svg-converter') {
        const { UniversalImageConverter } = await import('@/components/tools/image/UniversalImageConverter')
        return (
            <UniversalImageConverter
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
