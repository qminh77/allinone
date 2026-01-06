import {
    Globe,
    Search
} from 'lucide-react'

export type ModuleCategory = 'Network' | 'Utilities' | 'General'

export interface Module {
    key: string
    name: string
    description: string
    href: string
    icon: any
    category: ModuleCategory
    permission?: string
    isNew?: boolean
    isPopular?: boolean
}

export const modules: Module[] = [
    {
        key: 'dns-lookup',
        name: 'DNS Lookup',
        description: 'Tra cứu thông tin DNS (A, MX, NS, TXT...) của tên miền nhanh chóng.',
        href: '/tools/dns-lookup',
        icon: Globe,
        category: 'Network',
        isNew: true,
        isPopular: true
    }
]

export const categories: { key: ModuleCategory; name: string }[] = [
    { key: 'General', name: 'Tổng quan' },
    { key: 'Network', name: 'Mạng & Network' },
    { key: 'Utilities', name: 'Tiện ích' },
]
