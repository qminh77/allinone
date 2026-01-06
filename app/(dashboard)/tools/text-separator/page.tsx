import { TextSeparator } from '@/components/tools/TextSeparator'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Text Separator - Tách hoặc gộp danh sách văn bản | UMTERS.CLUB',
    description: 'Công cụ tách danh sách (Split) hoặc gộp (Join) văn bản bằng ký tự phân cách tùy chọn (dấu phẩy, xuống dòng, |).',
}

export default function TextSeparatorPage() {
    return <TextSeparator />
}
