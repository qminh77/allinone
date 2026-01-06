import { getMailHistory } from '@/lib/actions/mail'
import { MailHistoryTable } from '@/components/mail/MailHistoryTable'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { History } from 'lucide-react'

export default async function HistoryPage() {
    // @ts-ignore
    const logs = await getMailHistory()
    return (
        <ToolShell title="Lịch sử gửi mail" description="Theo dõi trạng thái và lịch sử các email đã gửi." icon={History}>
            <MailHistoryTable logs={logs} />
        </ToolShell>
    )
}
