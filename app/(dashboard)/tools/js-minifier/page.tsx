import { JsMinifier } from '@/components/tools/JsMinifier'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'JS Minifier - Nén JavaScript Online | UMTERS.CLUB',
    description: 'Công cụ nén JavaScript (JS) online miễn phí, giúp giảm dung lượng script.',
}

export default function JsMinifierPage() {
    return <JsMinifier />
}
