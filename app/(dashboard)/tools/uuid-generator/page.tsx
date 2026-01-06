import { ToolShell } from '@/components/dashboard/ToolShell'
import { UuidGenerator } from '@/components/tools/UuidGenerator'
import { Fingerprint } from 'lucide-react'

export default function UuidGeneratorPage() {
    return (
        <ToolShell
            title="UUID Generator"
            description="Tạo danh sách mã định danh duy nhất (UUID v4) nhanh chóng."
            icon={Fingerprint}
        >
            <UuidGenerator />
        </ToolShell>
    )
}
