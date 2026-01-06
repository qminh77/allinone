import { JsonValidator } from '@/components/tools/JsonValidator'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'JSON Validator & Beautifier - Kiểm tra và định dạng JSON | UMTERS.CLUB',
    description: 'Công cụ kiểm tra cú pháp JSON (Validate), làm đẹp (Beautify/Prettify) và nén (Minify) JSON online.',
}

export default function JsonValidatorPage() {
    return <JsonValidator />
}
