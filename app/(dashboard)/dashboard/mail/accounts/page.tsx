import { getSmtpConfigs } from '@/lib/actions/mail'
import { AccountList } from '@/components/mail/AccountList'
import { AccountForm } from '@/components/mail/AccountForm'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { Settings2 } from 'lucide-react'

export default async function AccountsPage() {
    // @ts-ignore
    const configs = await getSmtpConfigs()
    return (
        <ToolShell title="Quản lý tài khoản" description="Cấu hình danh sách các máy chủ SMTP để gửi mail." icon={Settings2}>
            <div className="space-y-6">
                <div className="flex justify-end">
                    <AccountForm />
                </div>
                <AccountList configs={configs} />
            </div>
        </ToolShell>
    )
}
