'use client'

import dynamic from 'next/dynamic'
import type { ModuleCatalogItem } from '@/config/modules'

const ExcelConverter = dynamic(
    () => import('@/components/tools/ExcelConverter').then(module => module.ExcelConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const JsonConverter = dynamic(
    () => import('@/components/tools/JsonConverter').then(module => module.JsonConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const CsvConverter = dynamic(
    () => import('@/components/tools/CsvConverter').then(module => module.CsvConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const MarkdownConverter = dynamic(
    () => import('@/components/tools/MarkdownConverter').then(module => module.MarkdownConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const HtmlConverter = dynamic(
    () => import('@/components/tools/HtmlConverter').then(module => module.HtmlConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const SqlConverter = dynamic(
    () => import('@/components/tools/SqlConverter').then(module => module.SqlConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const LatexConverter = dynamic(
    () => import('@/components/tools/LatexConverter').then(module => module.LatexConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const XmlConverter = dynamic(
    () => import('@/components/tools/XmlConverter').then(module => module.XmlConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const MysqlConverter = dynamic(
    () => import('@/components/tools/MysqlConverter').then(module => module.MysqlConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const MediawikiConverter = dynamic(
    () => import('@/components/tools/MediawikiConverter').then(module => module.MediawikiConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const MergePDF = dynamic(
    () => import('@/components/tools/pdf/MergePDF').then(module => module.MergePDF),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const SplitPDF = dynamic(
    () => import('@/components/tools/pdf/SplitPDF').then(module => module.SplitPDF),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const PDFToImage = dynamic(
    () => import('@/components/tools/pdf/PDFToImage').then(module => module.PDFToImage),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const ImageToPDF = dynamic(
    () => import('@/components/tools/pdf/ImageToPDF').then(module => module.ImageToPDF),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const RotatePDF = dynamic(
    () => import('@/components/tools/pdf/RotatePDF').then(module => module.RotatePDF),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const ProtectPDF = dynamic(
    () => import('@/components/tools/pdf/ProtectPDF').then(module => module.ProtectPDF),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const UnlockPDF = dynamic(
    () => import('@/components/tools/pdf/UnlockPDF').then(module => module.UnlockPDF),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const GeneralImageConverter = dynamic(
    () => import('@/components/tools/image/GeneralImageConverter').then(module => module.GeneralImageConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const HeicConverter = dynamic(
    () => import('@/components/tools/image/HeicConverter').then(module => module.HeicConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const SvgVectorConverter = dynamic(
    () => import('@/components/tools/image/SvgVectorConverter').then(module => module.SvgVectorConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const UniversalAudioConverter = dynamic(
    () => import('@/components/tools/audio/UniversalAudioConverter').then(module => module.UniversalAudioConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const UniversalFontConverter = dynamic(
    () => import('@/components/tools/font/UniversalFontConverter').then(module => module.UniversalFontConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)
const UniversalImageConverter = dynamic(
    () => import('@/components/tools/image/UniversalImageConverter').then(module => module.UniversalImageConverter),
    { ssr: false, loading: () => <ToolRouteLoading /> }
)

interface ToolRouteClientProps {
    moduleDef: Pick<ModuleCatalogItem, 'key' | 'name' | 'description' | 'category'>
}

function ToolRouteLoading() {
    return <div className="min-h-[60vh] rounded-lg border bg-muted/20 animate-pulse" />
}

export function ToolRouteClient({ moduleDef }: ToolRouteClientProps) {
    if (moduleDef.key.startsWith('excel-to-')) {
        return <ExcelConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key.startsWith('json-to-')) {
        return <JsonConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key.startsWith('csv-to-')) {
        return <CsvConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key.startsWith('markdown-to-')) {
        return <MarkdownConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key.startsWith('html-to-')) {
        return <HtmlConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key.startsWith('sql-to-')) {
        return <SqlConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key.startsWith('latex-to-')) {
        return <LatexConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key.startsWith('xml-to-')) {
        return <XmlConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key.startsWith('mysql-to-')) {
        return <MysqlConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key.startsWith('mediawiki-to-')) {
        return <MediawikiConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key === 'merge-pdf') {
        return <MergePDF slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key === 'split-pdf') {
        return <SplitPDF slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key === 'pdf-to-image') {
        return <PDFToImage slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key === 'image-to-pdf') {
        return <ImageToPDF slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key === 'rotate-pdf') {
        return <RotatePDF slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key === 'protect-pdf') {
        return <ProtectPDF slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key === 'unlock-pdf') {
        return <UnlockPDF slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (['webp-to-png', 'jfif-to-png', 'webp-to-jpg', 'svg-converter'].includes(moduleDef.key)) {
        return <GeneralImageConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (['heic-to-jpg', 'heic-to-png'].includes(moduleDef.key)) {
        return <HeicConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key === 'png-to-svg') {
        return <SvgVectorConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.category === 'Audio') {
        return <UniversalAudioConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.category === 'Font') {
        return <UniversalFontConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    if (moduleDef.key.endsWith('-converter') && moduleDef.key !== 'svg-converter') {
        return <UniversalImageConverter slug={moduleDef.key} title={moduleDef.name} description={moduleDef.description} />
    }

    return null
}
