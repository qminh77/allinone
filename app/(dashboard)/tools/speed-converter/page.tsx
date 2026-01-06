import { SpeedConverter } from '@/components/tools/SpeedConverter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Speed Converter - Chuyển đổi vận tốc (MPH/KPH) | UMTERS.CLUB',
    description: 'Công cụ chuyển đổi đơn vị vận tốc: Kilomet trên giờ (KPH/Km/h) và Dặm trên giờ (MPH).',
}

export default function SpeedConverterPage() {
    return <SpeedConverter />
}
