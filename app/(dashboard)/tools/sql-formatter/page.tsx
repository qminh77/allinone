import { SqlFormatter } from '@/components/tools/SqlFormatter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'SQL Formatter - Định dạng câu lệnh SQL | UMTERS.CLUB',
    description: 'Công cụ làm đẹp (Beautify) và định dạng câu truy vấn SQL online miễn phí. Hỗ trợ MySQL, PostgreSQL, SQL Server.',
}

export default function SqlFormatterPage() {
    return <SqlFormatter />
}
