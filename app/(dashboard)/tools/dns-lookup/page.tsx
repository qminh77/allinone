import { DNSLookup } from '@/components/tools/DNSLookup'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Globe } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'DNS Lookup Tool - UMTers Tools',
    description: 'Tra cứu thông tin DNS (A, MX, NS, TXT) miễn phí và nhanh chóng.'
}

export default function DNSLookupPage() {
    return (
        <ToolShell
            title="DNS Lookup"
            description="Tra cứu thông tin bản ghi DNS của bất kỳ tên miền nào. Hỗ trợ A, AAAA, MX, NS, TXT, SOA và hiển thị kết quả chi tiết."
            icon={Globe}
        >
            <DNSLookup />
        </ToolShell>
    )
}
