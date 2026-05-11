import { notFound } from 'next/navigation'
import { modules as fallbackModules } from '@/config/modules'
import type { ModuleCatalogItem } from '@/config/modules'
import { getModuleByKey } from '@/lib/modules/catalog'
import { ToolRouteClient } from '@/components/tools/ToolRouteClient'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

function isDynamicToolRoute(moduleDef: Pick<ModuleCatalogItem, 'key' | 'category'>) {
    return moduleDef.key.startsWith('excel-to-') ||
        moduleDef.key.startsWith('json-to-') ||
        moduleDef.key.startsWith('csv-to-') ||
        moduleDef.key.startsWith('markdown-to-') ||
        moduleDef.key.startsWith('html-to-') ||
        moduleDef.key.startsWith('sql-to-') ||
        moduleDef.key.startsWith('latex-to-') ||
        moduleDef.key.startsWith('xml-to-') ||
        moduleDef.key.startsWith('mysql-to-') ||
        moduleDef.key.startsWith('mediawiki-to-') ||
        [
            'merge-pdf',
            'split-pdf',
            'pdf-to-image',
            'image-to-pdf',
            'rotate-pdf',
            'protect-pdf',
            'unlock-pdf',
            'webp-to-png',
            'jfif-to-png',
            'webp-to-jpg',
            'svg-converter',
            'heic-to-jpg',
            'heic-to-png',
            'png-to-svg',
        ].includes(moduleDef.key) ||
        moduleDef.category === 'Audio' ||
        moduleDef.category === 'Font' ||
        (moduleDef.key.endsWith('-converter') && moduleDef.key !== 'svg-converter')
}

export default async function ToolPage({ params }: PageProps) {
    const { slug } = await params

    const moduleDef = await getModuleByKey(slug)

    if (!moduleDef || moduleDef.isEnabled === false) {
        notFound()
    }

    if (!isDynamicToolRoute(moduleDef)) {
        notFound()
    }

    return <ToolRouteClient moduleDef={moduleDef} />
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
