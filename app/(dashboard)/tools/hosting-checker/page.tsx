import { HostingChecker } from '@/components/tools/HostingChecker'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Website Hosting Checker - Kiểm tra nơi lưu trữ website | UMTERS.CLUB',
    description: 'Công cụ kiểm tra hosting provider, vị trí máy chủ và thông tin kỹ thuật của bất kỳ website nào.',
}

export default function HostingCheckerPage() {
    return <HostingChecker />
}
