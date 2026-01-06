import { HexConverter } from '@/components/tools/HexConverter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Hex Converter - Chuyển đổi Hex/Decimal/Text | UMTERS.CLUB',
    description: 'Công cụ chuyển đổi mã Hex sang Text (Chuỗi), Hex sang Decimal (Số thập phân) và ngược lại.',
}

export default function HexConverterPage() {
    return <HexConverter />
}
