import { HtmlEntityConverter } from '@/components/tools/HtmlEntityConverter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'HTML Entity Converter - Mã hóa/Giải mã ký tự HTML | UMTERS.CLUB',
    description: 'Công cụ chuyển đổi (Encode/Decode) các ký tự đặc biệt sang HTML Entities và ngược lại.',
}

export default function HtmlEntityConverterPage() {
    return <HtmlEntityConverter />
}
