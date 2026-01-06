import { IdnPunycodeConverter } from '@/components/tools/IdnPunycodeConverter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'IDN Punycode Converter - Chuyển đổi tên miền có dấu | UMTERS.CLUB',
    description: 'Công cụ chuyển đổi tên miền quốc tế (IDN) sang Punycode (xn--) và ngược lại.',
}

export default function IdnPunycodeConverterPage() {
    return <IdnPunycodeConverter />
}
