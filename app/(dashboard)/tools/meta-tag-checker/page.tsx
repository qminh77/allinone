import { MetaTagChecker } from '@/components/tools/MetaTagChecker'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Meta Tag Checker - Kiểm tra thẻ Meta SEO | UMTERS.CLUB',
    description: 'Công cụ phân tích thẻ Meta, Open Graph (OG) và Twitter Card cho SEO và Social Media.',
}

export default function MetaTagCheckerPage() {
    return <MetaTagChecker />
}
