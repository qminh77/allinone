import type { Metadata } from 'next'
import { QrCode } from 'lucide-react'

import { ToolShell } from '@/components/dashboard/ToolShell'
import { QRCodeGenerator } from '@/components/tools/QRCodeGenerator'

export const metadata: Metadata = {
    title: 'QR Code Generator - Allinone',
    description: 'Tạo QR Code cho URL, WiFi, vCard, SMS, email, sự kiện, social, file và app.',
}

export default function QRCodeGeneratorPage() {
    return (
        <ToolShell
            title="QR Code Generator"
            description="Tạo QR Code nhanh với preview realtime, tùy chỉnh màu, kích thước, error correction, download PNG/SVG/PDF và quản lý lịch sử."
            icon={QrCode}
        >
            <QRCodeGenerator />
        </ToolShell>
    )
}
