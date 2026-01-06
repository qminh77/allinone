import { notFound } from 'next/navigation'
import { modules } from '@/config/modules'
import { ExcelConverter } from '@/components/tools/ExcelConverter'
import { JsonConverter } from '@/components/tools/JsonConverter'
import { CsvConverter } from '@/components/tools/CsvConverter'
import { MarkdownConverter } from '@/components/tools/MarkdownConverter'
import { HtmlConverter } from '@/components/tools/HtmlConverter'

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

    return notFound()
}

export function generateStaticParams() {
    return modules
        .filter(m => ['Table', 'JSON', 'CSV', 'Markdown', 'HTML'].includes(m.category))
        .map(m => ({
            slug: m.key
        }))
}
