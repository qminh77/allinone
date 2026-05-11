import { getSmtpConfigs } from '@/lib/actions/mail'
import { SendMailClient } from '@/components/mail/SendMailClient'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Send } from 'lucide-react'

export default async function SendPage() {
    const configs = await getSmtpConfigs()
    return (
        <ToolShell title="Gửi Mail" description="Soạn và gửi email đến người dùng với định dạng HTML." icon={Send}>
            <SendMailClient configs={configs} />
        </ToolShell>
    )
}
