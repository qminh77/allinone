import { notFound } from 'next/navigation'
import { modules as fallbackModules } from '@/config/modules'
import { getModuleByKey } from '@/lib/modules/catalog'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function ToolPage({ params }: PageProps) {
    const { slug } = await params

    const moduleDef = await getModuleByKey(slug)

    if (!moduleDef || moduleDef.isEnabled === false) {
        notFound()
    }

    if (moduleDef.key.startsWith('excel-to-')) {
        const { ExcelConverter } = await import('@/components/tools/ExcelConverter')
        return (
            <ExcelConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('json-to-')) {
        const { JsonConverter } = await import('@/components/tools/JsonConverter')
        return (
            <JsonConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('csv-to-')) {
        const { CsvConverter } = await import('@/components/tools/CsvConverter')
        return (
            <CsvConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('markdown-to-')) {
        const { MarkdownConverter } = await import('@/components/tools/MarkdownConverter')
        return (
            <MarkdownConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('html-to-')) {
        const { HtmlConverter } = await import('@/components/tools/HtmlConverter')
        return (
            <HtmlConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('sql-to-')) {
        const { SqlConverter } = await import('@/components/tools/SqlConverter')
        return (
            <SqlConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('latex-to-')) {
        const { LatexConverter } = await import('@/components/tools/LatexConverter')
        return (
            <LatexConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('xml-to-')) {
        const { XmlConverter } = await import('@/components/tools/XmlConverter')
        return (
            <XmlConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('mysql-to-')) {
        const { MysqlConverter } = await import('@/components/tools/MysqlConverter')
        return (
            <MysqlConverter
                slug={moduleDef.key}
                title={moduleDef.name}
                description={moduleDef.description}
            />
        )
    }

    if (moduleDef.key.startsWith('mediawiki-to-')) {
        const { MediawikiConverter } = await import('@/components/tools/MediawikiConverter')
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
    return fallbackModules
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
