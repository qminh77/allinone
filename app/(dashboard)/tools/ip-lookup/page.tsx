
import { IPLookup } from '@/components/tools/IPLookup'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { MapPin } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'IP Lookup Tool - UMTers Tools',
    description: 'Tra cứu thông tin địa chỉ IP: Vị trí, ISP, ASN, Timezone miễn phí.'
}

export default function IPLookupPage() {
    return (
        <ToolShell
            title="IP Lookup"
            description="Kiểm tra thông tin chi tiết của bất kỳ địa chỉ IP nào. Bao gồm vị trí địa lý, nhà cung cấp dịch vụ (ISP), múi giờ và các thông tin kỹ thuật khác."
            icon={MapPin}
        >
            <IPLookup />
        </ToolShell>
    )
}
