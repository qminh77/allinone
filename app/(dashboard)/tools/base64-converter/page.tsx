import { ToolShell } from '@/components/dashboard/ToolShell'
import { Base64Converter } from '@/components/tools/Base64Converter'
import { FileCode } from 'lucide-react'

export default function Base64ConverterPage() {
    return (
        <ToolShell
            title="Base64 Converter"
            description="Chuyển đổi dữ liệu sang định dạng Base64 và ngược lại"
            icon={FileCode}
        >
            <Base64Converter />
        </ToolShell>
    )
}
