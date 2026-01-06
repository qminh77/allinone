import { DuplicateLinesRemover } from '@/components/tools/DuplicateLinesRemover'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Duplicate Lines Remover - Xóa dòng trùng lặp Online | UMTERS.CLUB',
    description: 'Công cụ lọc và xóa các dòng trùng lặp trong danh sách văn bản, hỗ trợ tùy chọn chữ hoa/thường.',
}

export default function DuplicateLinesRemoverPage() {
    return <DuplicateLinesRemover />
}
