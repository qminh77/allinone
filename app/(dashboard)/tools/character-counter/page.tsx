import { CharacterCounter } from '@/components/tools/CharacterCounter'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Character Counter - Đếm ký tự, đếm từ online | UMTERS.CLUB',
    description: 'Công cụ đếm số ký tự, số từ, số dòng và đoạn văn bản miễn phí, nhanh chóng.',
}

export default function CharacterCounterPage() {
    return <CharacterCounter />
}
