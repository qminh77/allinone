import { HtmlMinifier } from '@/components/tools/HtmlMinifier'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'HTML Minifier - Nén mã HTML Online | UMTERS.CLUB',
    description: 'Công cụ nén HTML online miễn phí, loại bỏ khoảng trắng và comments giúp tăng tốc độ website.',
}

export default function HtmlMinifierPage() {
    return <HtmlMinifier />
}
