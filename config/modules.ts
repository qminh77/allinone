import {
    Globe,
    Search,
    MapPin,
    ShieldCheck,
    FileText
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
    },
    {
        key: 'ip-lookup',
        name: 'IP Lookup',
        description: 'Tra cứu thông tin địa chỉ IP (ISP, Vị trí, ASN) chi tiết.',
        href: '/tools/ip-lookup',
        icon: MapPin,
        category: 'Network',
        isNew: true,
        isPopular: true
    },
    {
        key: 'ssl-lookup',
        name: 'SSL Lookup',
        description: 'Kiểm tra thông tin chứng chỉ SSL/TLS và thời hạn sử dụng.',
        href: '/tools/ssl-lookup',
        icon: ShieldCheck,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'whois-lookup',
        name: 'Whois Lookup',
        description: 'Kiểm tra thông tin tên miền, ngày đăng ký và nhà cung cấp.',
        href: '/tools/whois-lookup',
        icon: FileText,
        category: 'Utilities',
        isNew: true
    }
]

export const categories: { key: ModuleCategory; name: string }[] = [
    { key: 'General', name: 'Tổng quan' },
    { key: 'Network', name: 'Mạng & Network' },
    { key: 'Utilities', name: 'Tiện ích' },
]
