import { SlugGenerator } from '@/components/tools/SlugGenerator'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Slug Generator - Tạo URL thân thiện SEO | UMTERS.CLUB',
    description: 'Công cụ tạo URL slug từ văn bản tiếng Việt, hỗ trợ loại bỏ dấu, tùy chỉnh ký tự ngăn cách, tối ưu cho SEO.',
}

export default function SlugGeneratorPage() {
    return <SlugGenerator />
}
