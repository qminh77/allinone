import { UserAgentParser } from '@/components/tools/UserAgentParser'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'User Agent Parser - Kiểm tra thông tin thiết bị | UMTERS.CLUB',
    description: 'Công cụ phân tích User Agent online, giúp xác định hệ điều hành, trình duyệt, thiết bị và CPU.',
}

export default function UserAgentParserPage() {
    return <UserAgentParser />
}
