import { ToolShell } from '@/components/dashboard/ToolShell'
import { SpinWheel } from '@/components/tools/SpinWheel'
import { Metadata } from 'next'
import { Disc } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Spin Wheel - Vòng quay may mắn Online | UMTERS.CLUB',
    description: 'Công cụ vòng quay may mắn online (Spin Wheel) giúp bạn chọn ngẫu nhiên một lựa chọn từ danh sách.',
}

export default function SpinWheelPage() {
    return (
        <ToolShell
            title="Spin Wheel"
            description="Nhập danh sách và quay để chọn ra người may mắn ngẫu nhiên."
            icon={Disc}
        >
            <SpinWheel />
        </ToolShell>
    )
}
