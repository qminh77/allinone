import { RomanNumeralConverter } from '@/components/tools/RomanNumeralConverter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Roman Numeral Converter - Chuyển đổi số La Mã | UMTERS.CLUB',
    description: 'Công cụ chuyển đổi số tự nhiên sang số La Mã (Roman Numerals) và ngược lại.',
}

export default function RomanNumeralConverterPage() {
    return <RomanNumeralConverter />
}
