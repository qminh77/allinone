import { ToolShell } from '@/components/dashboard/ToolShell'
import { SSLLookup } from '@/components/tools/SSLLookup'
import { ShieldCheck } from 'lucide-react'

export default function SSLLookupPage() {
    return (
        <ToolShell
            title="Kiểm tra SSL"
            description="Kiểm tra thông tin chứng chỉ bảo mật và thời hạn sử dụng"
            icon={ShieldCheck}
        >
            <SSLLookup />
        </ToolShell>
    )
}
