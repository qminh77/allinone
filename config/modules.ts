import {
    Globe,
    Search,
    MapPin,
    ShieldCheck,
    FileText,
    Activity,
    Hash,
    FileCode,
    Key,
    Lock,
    KeyRound,
    Link,
    MonitorSmartphone,
    Server,
    Type,
    Link2
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
    },
    {
        key: 'ping-tool',
        name: 'Ping & Port',
        description: 'Kiểm tra trạng thái Website (HTTP Ping) và Open Port.',
        href: '/tools/ping',
        icon: Activity,
        category: 'Network',
        isNew: true
    },
    {
        key: 'md5-generator',
        name: 'MD5 Generator',
        description: 'Công cụ tạo mã MD5 Hash nhanh chóng.',
        href: '/tools/md5-generator',
        icon: Hash,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'base64-converter',
        name: 'Base64 Converter',
        description: 'Mã hóa và giải mã Base64 (Encode/Decode).',
        href: '/tools/base64-converter',
        icon: FileCode,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'markdown-to-html',
        name: 'Markdown to HTML',
        description: 'Chuyển đổi Markdown sang HTML với Live Preview.',
        href: '/tools/markdown-to-html',
        icon: FileCode,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'uuid-generator',
        name: 'UUID Generator',
        description: 'Tạo mã UUID v4 ngẫu nhiên (Bulk supported).',
        href: '/tools/uuid-generator',
        icon: Key,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'bcrypt-generator',
        name: 'Bcrypt Generator',
        description: 'Tạo mã băm Bcrypt và kiểm tra mật khẩu.',
        href: '/tools/bcrypt-generator',
        icon: Lock,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'password-generator',
        name: 'Password Generator',
        description: 'Tạo mật khẩu mạnh ngẫu nhiên (Strong Password).',
        href: '/tools/password-generator',
        icon: KeyRound,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'slug-generator',
        name: 'Slug Generator',
        description: 'Tạo URL Slug thân thiện SEO từ văn bản.',
        href: '/tools/slug-generator',
        icon: Link,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'html-minifier',
        name: 'HTML Minifier',
        description: 'Tối ưu hóa và nén mã HTML (remove whitespace/comments).',
        href: '/tools/html-minifier',
        icon: FileCode,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'css-minifier',
        name: 'CSS Minifier',
        description: 'Nén mã CSS/StyleSheet để tối ưu tốc độ tải trang.',
        href: '/tools/css-minifier',
        icon: FileCode, // Or Palette if imported
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'js-minifier',
        name: 'JS Minifier',
        description: 'Nén và tối ưu mã JavaScript (Basic Minification).',
        href: '/tools/js-minifier',
        icon: FileCode, // Or Braces if imported
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'user-agent-parser',
        name: 'User Agent Parser',
        description: 'Phân tích chuỗi User Agent để lấy thông tin thiết bị, OS, Browser.',
        href: '/tools/user-agent-parser',
        icon: MonitorSmartphone,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'hosting-checker',
        name: 'Hosting Checker',
        description: 'Kiểm tra nhà cung cấp Hosting (ISP) và vị trí máy chủ của website.',
        href: '/tools/hosting-checker',
        icon: Server,
        category: 'Network',
        isNew: true
    },
    {
        key: 'character-counter',
        name: 'Character Counter',
        description: 'Đếm số ký tự, từ, câu, đoạn văn trong văn bản.',
        href: '/tools/character-counter',
        icon: Type,
        category: 'Utilities',
        isNew: true
    },
    {
        key: 'url-parser',
        name: 'URL Parser',
        description: 'Phân tích URL thành các thành phần: Protocol, Host, Path, Query Params...',
        href: '/tools/url-parser',
        icon: Link2,
        category: 'Utilities',
        isNew: true
    }
]

export const categories: { key: ModuleCategory; name: string }[] = [
    { key: 'General', name: 'Tổng quan' },
    { key: 'Network', name: 'Mạng & Network' },
    { key: 'Utilities', name: 'Tiện ích' },
]
