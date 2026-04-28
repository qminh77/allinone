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
    const moduleDef = modules.find(m => m.key === slug)

    // If not found, return 404
    if (!moduleDef) {
        notFound()
    }

    if (moduleDef.key.startsWith('excel-to-')) {
        return (
            <ExcelConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('json-to-')) {
        return (
            <JsonConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('csv-to-')) {
        return (
            <CsvConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('markdown-to-')) {
        return (
            <MarkdownConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('html-to-')) {
        return (
            <HtmlConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('sql-to-')) {
        return (
            <SqlConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('latex-to-')) {
        return (
            <LatexConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('xml-to-')) {
        return (
            <XmlConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('mysql-to-')) {
        return (
            <MysqlConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('mediawiki-to-')) {
        return (
            <MediawikiConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key === 'merge-pdf') {
        const { MergePDF } = await import('@/components/tools/pdf/MergePDF') // Dynamic import to avoid heavy bundle if not used
        return (
            <MergePDF
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key === 'split-pdf') {
        const { SplitPDF } = await import('@/components/tools/pdf/SplitPDF')
        return (
            <SplitPDF
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key === 'pdf-to-image') {
        const { PDFToImage } = await import('@/components/tools/pdf/PDFToImage')
        return (
            <PDFToImage
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key === 'image-to-pdf') {
        const { ImageToPDF } = await import('@/components/tools/pdf/ImageToPDF')
        return (
            <ImageToPDF
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key === 'rotate-pdf') {
        const { RotatePDF } = await import('@/components/tools/pdf/RotatePDF')
        return (
            <RotatePDF
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key === 'protect-pdf') {
        const { ProtectPDF } = await import('@/components/tools/pdf/ProtectPDF')
        return (
            <ProtectPDF
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key === 'unlock-pdf') {
        const { UnlockPDF } = await import('@/components/tools/pdf/UnlockPDF')
        return (
            <UnlockPDF
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }


    if (['webp-to-png', 'jfif-to-png', 'webp-to-jpg', 'svg-converter'].includes(moduleDef.key)) {
        const { GeneralImageConverter } = await import('@/components/tools/image/GeneralImageConverter')
        return (
            <GeneralImageConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (['heic-to-jpg', 'heic-to-png'].includes(moduleDef.key)) {
        const { HeicConverter } = await import('@/components/tools/image/HeicConverter')
        return (
            <HeicConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key === 'png-to-svg') {
        const { SvgVectorConverter } = await import('@/components/tools/image/SvgVectorConverter')
        return (
            <SvgVectorConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.category === 'Audio') {
        const { UniversalAudioConverter } = await import('@/components/tools/audio/UniversalAudioConverter')
        return (
            <UniversalAudioConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.category === 'Font') {
        const { UniversalFontConverter } = await import('@/components/tools/font/UniversalFontConverter')
        return (
            <UniversalFontConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    // Existing catch-all for converters
    if (moduleDef.key.endsWith('-converter') && moduleDef.key !== 'svg-converter') {
        const { UniversalImageConverter } = await import('@/components/tools/image/UniversalImageConverter')
        return (
            <UniversalImageConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
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
