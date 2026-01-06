import { ToolShell } from '@/components/dashboard/ToolShell'
import { BcryptGenerator } from '@/components/tools/BcryptGenerator'
import { Lock } from 'lucide-react'

export default function BcryptGeneratorPage() {
    return (
        <ToolShell
            title="Bcrypt Generator"
            description="Tạo và kiểm tra mã băm mật khẩu sử dụng thuật toán Bcrypt."
            icon={Lock}
        >
            <BcryptGenerator />
        </ToolShell>
    )
}
