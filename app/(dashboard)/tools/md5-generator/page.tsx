import { ToolShell } from '@/components/dashboard/ToolShell'
import { Md5Generator } from '@/components/tools/Md5Generator'
import { Hash } from 'lucide-react'

export default function Md5GeneratorPage() {
    return (
        <ToolShell
            title="MD5 Generator"
            description="Tạo mã MD5 an toàn từ chuỗi văn bản bất kỳ"
            icon={Hash}
        >
            <Md5Generator />
        </ToolShell>
    )
}
