import { DataConverter } from '@/components/tools/DataConverter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Data Unit Converter - Chuyển đổi đơn vị dữ liệu | UMTERS.CLUB',
    description: 'Công cụ chuyển đổi đơn vị lưu trữ dữ liệu: Bit, Byte, KB, MB, GB, TB, KiB, MiB, GiB...',
}

export default function DataConverterPage() {
    return <DataConverter />
}
