import { LoremIpsumGenerator } from '@/components/tools/LoremIpsumGenerator'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Lorem Ipsum Generator - Tạo văn bản giả (Dummy Text) | UMTERS.CLUB',
    description: 'Công cụ tạo văn bản Lorem Ipsum mẫu cho thiết kế và dàn trang (Layout).',
}

export default function LoremIpsumGeneratorPage() {
    return <LoremIpsumGenerator />
}
