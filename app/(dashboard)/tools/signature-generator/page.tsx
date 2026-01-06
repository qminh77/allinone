import { SignatureGenerator } from '@/components/tools/SignatureGenerator'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Signature Generator - Tạo chữ ký Online | UMTERS.CLUB',
    description: 'Công cụ tạo chữ ký online (Digital Signature), vẽ chữ ký và tải xuống dưới dạng ảnh PNG trong suốt.',
}

export default function SignatureGeneratorPage() {
    return <SignatureGenerator />
}
