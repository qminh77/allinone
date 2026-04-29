import {
    Activity,
    AlignLeft,
    ArrowLeftRight,
    Binary,
    BookOpen,
    BrainCircuit,
    Code,
    Database,
    Disc,
    Download,
    FileCode,
    FileDown,
    FileJson,
    FileSpreadsheet,
    FileText,
    Files,
    Gauge,
    Globe,
    Globe2,
    HardDrive,
    Hash,
    Image as ImageIcon,
    Key,
    KeyRound,
    Link,
    Link2,
    ListFilter,
    Lock,
    Mail,
    MapPin,
    MonitorSmartphone,
    Music,
    Palette,
    PenTool,
    QrCode,
    RotateCw,
    Scissors,
    Search,
    SeparatorHorizontal,
    Server,
    ShieldCheck,
    Thermometer,
    Type,
    Unlock,
    Video,
    Workflow,
    Wrench,
    Zap,
    type LucideIcon,
} from 'lucide-react'

export type ModuleCategory = 'AI' | 'Network' | 'Utilities' | 'General' | 'Table' | 'JSON' | 'CSV' | 'Markdown' | 'HTML' | 'SQL' | 'LaTeX' | 'XML' | 'MySQL' | 'MediaWiki' | 'PDF' | 'Image' | 'Font' | 'Audio' | 'Video'

export interface ModuleCatalogItem {
    key: string
    name: string
    description: string
    href: string
    icon: string | null
    category: string
    permission?: string
    isNew: boolean
    isPopular: boolean
    isEnabled: boolean
    sortOrder: number
}

export const categories: { key: ModuleCategory; name: string }[] = [
    { key: 'AI', name: 'AI' },
    { key: 'General', name: 'Tổng quan' },
    { key: 'Network', name: 'Mạng & Network' },
    { key: 'Utilities', name: 'Tiện ích' },
    { key: 'Table', name: 'Table Converter' },
    { key: 'JSON', name: 'JSON Converter' },
    { key: 'CSV', name: 'CSV Converter' },
    { key: 'Markdown', name: 'Markdown Converter' },
    { key: 'HTML', name: 'HTML Converter' },
    { key: 'SQL', name: 'SQL Converter' },
    { key: 'LaTeX', name: 'LaTeX Converter' },
    { key: 'XML', name: 'XML Converter' },
    { key: 'MySQL', name: 'MySQL Converter' },
    { key: 'MediaWiki', name: 'MediaWiki Converter' },
    { key: 'PDF', name: 'PDF Tools' },
    { key: 'Image', name: 'Image Tools' },
    { key: 'Font', name: 'Font Tools' },
    { key: 'Audio', name: 'Audio Tools' },
    { key: 'Video', name: 'Video Tools' },
]

const moduleIconByKey: Record<string, LucideIcon> = {
    'ai-assistant': BrainCircuit,
    'flow-builder': Workflow,
    'dns-lookup': Globe,
    'ip-lookup': MapPin,
    'ssl-lookup': ShieldCheck,
    'whois-lookup': FileText,
    'ping-tool': Activity,
    'md5-generator': Hash,
    'base64-converter': FileCode,
    'uuid-generator': Key,
    'bcrypt-generator': Lock,
    'spin-wheel': Disc,
    'video-downloader': Download,
    'scribd-downloader': FileText,
    'password-generator': KeyRound,
    'slug-generator': Link,
    'qr-code': QrCode,
    'html-minifier': FileCode,
    'css-minifier': FileCode,
    'js-minifier': FileCode,
    'user-agent-parser': MonitorSmartphone,
    'hosting-checker': Server,
    'character-counter': Type,
    'text-formatter': AlignLeft,
    'url-parser': Link2,
    'color-converter': Palette,
    'http-header-lookup': ArrowLeftRight,
    'duplicate-lines-remover': ListFilter,
    'idn-punycode-converter': Globe2,
    'json-validator': FileJson,
    'meta-tag-checker': Search,
    'sql-formatter': Server,
    'html-entity-converter': Code,
    'binary-converter': Binary,
    'text-separator': SeparatorHorizontal,
    'hex-converter': Hash,
    'signature-generator': PenTool,
    'lorem-ipsum-generator': AlignLeft,
    'temperature-converter': Thermometer,
    'speed-converter': Gauge,
    'roman-numeral-converter': Hash,
    'data-converter': HardDrive,
    shortlinks: Scissors,
    'mail-system': Mail,
    'quiz-system': FileText,
    'flashcard-system': BookOpen,
    'merge-pdf': Files,
    'split-pdf': Scissors,
    'pdf-to-image': ImageIcon,
    'image-to-pdf': FileDown,
    'rotate-pdf': RotateCw,
    'protect-pdf': Lock,
    'unlock-pdf': Unlock,
    'webp-to-png': ImageIcon,
    'jfif-to-png': ImageIcon,
    'png-to-svg': Zap,
    'heic-to-jpg': ImageIcon,
    'heic-to-png': ImageIcon,
}

const categoryIconByKey: Record<string, LucideIcon> = {
    AI: BrainCircuit,
    General: Wrench,
    Network: Globe,
    Utilities: Wrench,
    Table: FileSpreadsheet,
    JSON: FileJson,
    CSV: FileSpreadsheet,
    Markdown: FileCode,
    HTML: FileCode,
    SQL: Database,
    LaTeX: FileCode,
    XML: FileCode,
    MySQL: Database,
    MediaWiki: FileCode,
    PDF: Files,
    Image: ImageIcon,
    Font: Type,
    Audio: Music,
    Video: Video,
}

export function getModuleIcon(moduleItem: Pick<ModuleCatalogItem, 'key' | 'icon' | 'category'>): LucideIcon {
    return moduleIconByKey[moduleItem.icon || ''] ||
        moduleIconByKey[moduleItem.key] ||
        categoryIconByKey[moduleItem.category] ||
        Wrench
}

export function getCategoryName(categoryKey: string) {
    return categories.find(category => category.key === categoryKey)?.name || categoryKey
}
