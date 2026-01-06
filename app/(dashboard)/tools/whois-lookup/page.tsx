import { ToolShell } from '@/components/dashboard/ToolShell'
import { WhoisLookup } from '@/components/tools/WhoisLookup'
import { FileText } from 'lucide-react'

export default function WhoisLookupPage() {
    return (
        <ToolShell
            title="Whois Lookup"
            description="Tra cứu thông tin chủ sở hữu, ngày đăng ký và nhà cung cấp tên miền"
            icon={FileText}
        >
            <WhoisLookup />
        </ToolShell>
    )
}
