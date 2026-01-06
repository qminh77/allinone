import { HttpHeaderLookup } from '@/components/tools/HttpHeaderLookup'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'HTTP Header Lookup - Kiểm tra Header Response | UMTERS.CLUB',
    description: 'Công cụ kiểm tra HTTP Headers, Status Code (200, 301, 404, 500) và điều hướng Redirect.',
}

export default function HttpHeaderLookupPage() {
    return <HttpHeaderLookup />
}
