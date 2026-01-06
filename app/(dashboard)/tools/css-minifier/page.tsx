import { CssMinifier } from '@/components/tools/CssMinifier'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'CSS Minifier - Nén mã CSS Online | UMTERS.CLUB',
    description: 'Công cụ nén CSS online miễn phí, tối ưu dung lượng file stylesheet.',
}

export default function CssMinifierPage() {
    return <CssMinifier />
}
