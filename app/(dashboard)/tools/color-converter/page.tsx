import { ColorConverter } from '@/components/tools/ColorConverter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Color Converter - Chuyển đổi mã màu Online (Hex, RGB, CMYK) | UMTERS.CLUB',
    description: 'Công cụ chuyển đổi mã màu miễn phí: Hex to RGB, RGB to Hex, Hex to CMYK, HSL...',
}

export default function ColorConverterPage() {
    return <ColorConverter />
}
