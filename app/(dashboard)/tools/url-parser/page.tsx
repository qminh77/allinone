import { UrlParser } from '@/components/tools/UrlParser'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'URL Parser - Phân tách link online | UMTERS.CLUB',
    description: 'Công cụ phân tích URL, tách lấy hostname, path và các tham số query param nhanh chóng.',
}

export default function UrlParserPage() {
    return <UrlParser />
}
