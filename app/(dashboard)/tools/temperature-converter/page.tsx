import { TemperatureConverter } from '@/components/tools/TemperatureConverter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Temperature Converter - Chuyển đổi nhiệt độ (C/F/K) | UMTERS.CLUB',
    description: 'Công cụ chuyển đổi đơn vị nhiệt độ: Celsius (°C), Fahrenheit (°F) và Kelvin (K).',
}

export default function TemperatureConverterPage() {
    return <TemperatureConverter />
}
