import { ToolShell } from '@/components/dashboard/ToolShell'
import { PasswordGenerator } from '@/components/tools/PasswordGenerator'
import { KeyRound } from 'lucide-react'

export default function PasswordGeneratorPage() {
    return (
        <ToolShell
            title="Password Generator"
            description="Tạo mật khẩu mạnh ngẫu nhiên với các tùy chọn bảo mật tùy chỉnh."
            icon={KeyRound}
        >
            <PasswordGenerator />
        </ToolShell>
    )
}
