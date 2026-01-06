import { BinaryConverter } from '@/components/tools/BinaryConverter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Text to Binary Converter - Chuyển đổi văn bản sang nhị phân | UMTERS.CLUB',
    description: 'Công cụ chuyển đổi văn bản sang mã nhị phân (Binary) và ngược lại.',
}

export default function BinaryConverterPage() {
    return <BinaryConverter />
}
