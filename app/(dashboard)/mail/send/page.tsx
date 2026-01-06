import { getSmtpConfigs } from '@/lib/actions/mail'
import { SendMailForm } from '@/components/mail/SendMailForm'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Send } from 'lucide-react'

export default async function SendPage() {
    // @ts-ignore
    const configs = await getSmtpConfigs()
    return (
        <ToolShell title="Gửi Mail" description="Soạn và gửi email đến người dùng với định dạng HTML." icon={Send}>
            <SendMailForm configs={configs} />
        </ToolShell>
    )
}
