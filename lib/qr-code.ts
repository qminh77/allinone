export type QrType =
    | 'url'
    | 'text'
    | 'email'
    | 'phone'
    | 'sms'
    | 'wifi'
    | 'vcard'
    | 'location'
    | 'event'
    | 'social'
    | 'crypto'
    | 'file'
    | 'app'

export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass'
export type SocialPlatform = 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'zalo'
export type CryptoNetwork = 'bitcoin' | 'ethereum' | 'litecoin' | 'dogecoin' | 'custom'
export type AppPlatform = 'app-store' | 'play-store' | 'direct'

export interface QrTypeDefinition {
    key: QrType
    name: string
    description: string
}

export interface QrFormValues {
    url: string
    text: string
    email: {
        to: string
        subject: string
        body: string
    }
    phone: string
    sms: {
        phone: string
        message: string
    }
    wifi: {
        ssid: string
        password: string
        encryption: WifiEncryption
        hidden: boolean
    }
    vcard: {
        firstName: string
        lastName: string
        organization: string
        title: string
        phone: string
        email: string
        website: string
        address: string
        note: string
    }
    location: {
        latitude: string
        longitude: string
        label: string
    }
    event: {
        title: string
        description: string
        location: string
        startsAt: string
        endsAt: string
    }
    social: {
        platform: SocialPlatform
        value: string
    }
    crypto: {
        network: CryptoNetwork
        address: string
        amount: string
        label: string
    }
    file: {
        url: string
    }
    app: {
        platform: AppPlatform
        value: string
    }
}

export interface QrDesign {
    foreground: string
    background: string
    size: number
    errorCorrectionLevel: QrErrorCorrectionLevel
}

export interface QrPayloadResult {
    payload: string
    label: string
    isUrlLike: boolean
    normalizedUrl?: string
    error?: string
    warning?: string
}

export interface SavedQrCode {
    id: string
    name: string
    type: QrType
    payload: string
    form: QrFormValues
    design: QrDesign
    folder: string
    tags: string[]
    shortUrl?: string
    createdAt: string
    updatedAt: string
}

export const QR_TYPE_DEFINITIONS: QrTypeDefinition[] = [
    { key: 'url', name: 'URL / Website', description: 'Link website hoặc landing page.' },
    { key: 'text', name: 'Text', description: 'Văn bản thuần.' },
    { key: 'email', name: 'Email', description: 'Soạn email với người nhận, tiêu đề và nội dung.' },
    { key: 'phone', name: 'Phone', description: 'Gọi điện trực tiếp, hỗ trợ chuẩn +84.' },
    { key: 'sms', name: 'SMS', description: 'Gửi tin nhắn đến số điện thoại.' },
    { key: 'wifi', name: 'WiFi', description: 'Kết nối WiFi bằng SSID và mật khẩu.' },
    { key: 'vcard', name: 'vCard / Business Card', description: 'Danh thiếp điện tử.' },
    { key: 'location', name: 'Location / Maps', description: 'Tọa độ mở bằng Google Maps.' },
    { key: 'event', name: 'Event / Calendar', description: 'Lịch sự kiện chuẩn iCalendar.' },
    { key: 'social', name: 'Social Media', description: 'Facebook, Instagram, YouTube, TikTok, Zalo.' },
    { key: 'crypto', name: 'Bitcoin / Crypto', description: 'Địa chỉ ví hoặc URI thanh toán crypto.' },
    { key: 'file', name: 'PDF / File', description: 'Link tải file trực tiếp.' },
    { key: 'app', name: 'App Store / Play', description: 'Link tải ứng dụng iOS, Android hoặc direct.' },
]

export const DEFAULT_QR_DESIGN: QrDesign = {
    foreground: '#111827',
    background: '#ffffff',
    size: 800,
    errorCorrectionLevel: 'M',
}

export function createDefaultQrForm(): QrFormValues {
    return {
        url: 'https://example.com',
        text: 'Hello from Allinone QR Code',
        email: {
            to: '',
            subject: '',
            body: '',
        },
        phone: '+84901234567',
        sms: {
            phone: '+84901234567',
            message: '',
        },
        wifi: {
            ssid: '',
            password: '',
            encryption: 'WPA',
            hidden: false,
        },
        vcard: {
            firstName: '',
            lastName: '',
            organization: '',
            title: '',
            phone: '',
            email: '',
            website: '',
            address: '',
            note: '',
        },
        location: {
            latitude: '10.7769',
            longitude: '106.7009',
            label: 'Ho Chi Minh City',
        },
        event: {
            title: '',
            description: '',
            location: '',
            startsAt: '',
            endsAt: '',
        },
        social: {
            platform: 'facebook',
            value: '',
        },
        crypto: {
            network: 'bitcoin',
            address: '',
            amount: '',
            label: '',
        },
        file: {
            url: '',
        },
        app: {
            platform: 'play-store',
            value: '',
        },
    }
}

export function mergeQrFormValues(values?: Partial<QrFormValues>): QrFormValues {
    const defaults = createDefaultQrForm()
    if (!values) return defaults

    return {
        ...defaults,
        ...values,
        email: { ...defaults.email, ...values.email },
        sms: { ...defaults.sms, ...values.sms },
        wifi: { ...defaults.wifi, ...values.wifi },
        vcard: { ...defaults.vcard, ...values.vcard },
        location: { ...defaults.location, ...values.location },
        event: { ...defaults.event, ...values.event },
        social: { ...defaults.social, ...values.social },
        crypto: { ...defaults.crypto, ...values.crypto },
        file: { ...defaults.file, ...values.file },
        app: { ...defaults.app, ...values.app },
    }
}

export function mergeQrDesign(design?: Partial<QrDesign>): QrDesign {
    return {
        ...DEFAULT_QR_DESIGN,
        ...design,
        size: clampOutputSize(design?.size ?? DEFAULT_QR_DESIGN.size),
        errorCorrectionLevel: isQrErrorCorrectionLevel(design?.errorCorrectionLevel)
            ? design.errorCorrectionLevel
            : DEFAULT_QR_DESIGN.errorCorrectionLevel,
    }
}

export function buildQrPayload(type: QrType, values: QrFormValues): QrPayloadResult {
    switch (type) {
        case 'url':
            return buildUrlPayload(values.url, 'Website')
        case 'text':
            return buildTextPayload(values.text)
        case 'email':
            return buildEmailPayload(values.email)
        case 'phone':
            return buildPhonePayload(values.phone)
        case 'sms':
            return buildSmsPayload(values.sms)
        case 'wifi':
            return buildWifiPayload(values.wifi)
        case 'vcard':
            return buildVcardPayload(values.vcard)
        case 'location':
            return buildLocationPayload(values.location)
        case 'event':
            return buildEventPayload(values.event)
        case 'social':
            return buildSocialPayload(values.social)
        case 'crypto':
            return buildCryptoPayload(values.crypto)
        case 'file':
            return buildFilePayload(values.file)
        case 'app':
            return buildAppPayload(values.app)
        default:
            return invalidPayload('Loại QR chưa được hỗ trợ.')
    }
}

export function parseTags(input: string): string[] {
    return input
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
        .slice(0, 12)
}

export function createQrId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function clampOutputSize(size: number) {
    if (!Number.isFinite(size)) return DEFAULT_QR_DESIGN.size
    return Math.min(2000, Math.max(200, Math.round(size)))
}

export function sanitizeQrFilename(value: string) {
    const base = value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()

    return base.slice(0, 80) || 'qr-code'
}

export function getQrTypeName(type: QrType) {
    return QR_TYPE_DEFINITIONS.find(item => item.key === type)?.name || type
}

function buildUrlPayload(value: string, label: string): QrPayloadResult {
    const normalized = normalizeHttpUrl(value)
    if (!normalized.ok) return invalidPayload(normalized.error)

    return {
        payload: normalized.url,
        label,
        isUrlLike: true,
        normalizedUrl: normalized.url,
    }
}

function buildTextPayload(value: string): QrPayloadResult {
    const text = value.trim()
    if (!text) return invalidPayload('Vui lòng nhập nội dung văn bản.')
    if (text.length > 2500) return invalidPayload('Văn bản quá dài. Hãy giữ dưới 2.500 ký tự để QR dễ scan hơn.')

    return {
        payload: text,
        label: text.slice(0, 48) || 'Text',
        isUrlLike: false,
        warning: text.length > 1200 ? 'Nội dung dài có thể làm QR dày và khó scan.' : undefined,
    }
}

function buildEmailPayload(value: QrFormValues['email']): QrPayloadResult {
    const to = value.to.trim()
    if (!isValidEmail(to)) return invalidPayload('Email người nhận không hợp lệ.')

    const params = new URLSearchParams()
    if (value.subject.trim()) params.set('subject', value.subject.trim())
    if (value.body.trim()) params.set('body', value.body.trim())

    const query = params.toString()
    return {
        payload: `mailto:${to}${query ? `?${query}` : ''}`,
        label: to,
        isUrlLike: false,
    }
}

function buildPhonePayload(value: string): QrPayloadResult {
    const phone = normalizePhoneNumber(value)
    if (!phone) return invalidPayload('Số điện thoại không hợp lệ. Ví dụ: +84901234567 hoặc 0901234567.')

    return {
        payload: `tel:${phone}`,
        label: phone,
        isUrlLike: false,
    }
}

function buildSmsPayload(value: QrFormValues['sms']): QrPayloadResult {
    const phone = normalizePhoneNumber(value.phone)
    if (!phone) return invalidPayload('Số điện thoại SMS không hợp lệ.')

    return {
        payload: `SMSTO:${phone}:${escapeSmsText(value.message.trim())}`,
        label: `SMS ${phone}`,
        isUrlLike: false,
    }
}

function buildWifiPayload(value: QrFormValues['wifi']): QrPayloadResult {
    const ssid = value.ssid.trim()
    if (!ssid) return invalidPayload('Vui lòng nhập SSID WiFi.')
    if (value.encryption !== 'nopass' && !value.password) return invalidPayload('Vui lòng nhập mật khẩu WiFi hoặc chọn No password.')

    return {
        payload: `WIFI:T:${value.encryption};S:${escapeWifiValue(ssid)};P:${escapeWifiValue(value.password)};H:${value.hidden ? 'true' : 'false'};;`,
        label: ssid,
        isUrlLike: false,
    }
}

function buildVcardPayload(value: QrFormValues['vcard']): QrPayloadResult {
    const firstName = value.firstName.trim()
    const lastName = value.lastName.trim()
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
    const organization = value.organization.trim()

    if (!fullName && !organization) {
        return invalidPayload('Vui lòng nhập tên hoặc công ty cho danh thiếp.')
    }

    if (value.email.trim() && !isValidEmail(value.email.trim())) {
        return invalidPayload('Email trong vCard không hợp lệ.')
    }

    const phone = value.phone.trim() ? normalizePhoneNumber(value.phone) : ''
    if (value.phone.trim() && !phone) return invalidPayload('Số điện thoại trong vCard không hợp lệ.')

    const website = value.website.trim()
    const normalizedWebsite = website ? normalizeHttpUrl(website) : undefined
    if (website && normalizedWebsite && !normalizedWebsite.ok) return invalidPayload(normalizedWebsite.error)

    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${escapeVcardValue(lastName)};${escapeVcardValue(firstName)};;;`,
        `FN:${escapeVcardValue(fullName || organization)}`,
    ]

    if (organization) lines.push(`ORG:${escapeVcardValue(organization)}`)
    if (value.title.trim()) lines.push(`TITLE:${escapeVcardValue(value.title.trim())}`)
    if (phone) lines.push(`TEL;TYPE=CELL:${phone}`)
    if (value.email.trim()) lines.push(`EMAIL:${value.email.trim()}`)
    if (normalizedWebsite?.ok) lines.push(`URL:${normalizedWebsite.url}`)
    if (value.address.trim()) lines.push(`ADR;TYPE=WORK:;;${escapeVcardValue(value.address.trim())};;;;`)
    if (value.note.trim()) lines.push(`NOTE:${escapeVcardValue(value.note.trim())}`)
    lines.push('END:VCARD')

    return {
        payload: lines.join('\n'),
        label: fullName || organization,
        isUrlLike: false,
    }
}

function buildLocationPayload(value: QrFormValues['location']): QrPayloadResult {
    const lat = Number(value.latitude)
    const lng = Number(value.longitude)

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return invalidPayload('Latitude phải nằm trong khoảng -90 đến 90.')
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return invalidPayload('Longitude phải nằm trong khoảng -180 đến 180.')

    const label = value.label.trim()
    const url = new URL('https://www.google.com/maps')
    url.searchParams.set('q', `${lat},${lng}${label ? ` (${label})` : ''}`)

    return {
        payload: url.toString(),
        label: label || `${lat}, ${lng}`,
        isUrlLike: true,
        normalizedUrl: url.toString(),
    }
}

function buildEventPayload(value: QrFormValues['event']): QrPayloadResult {
    const title = value.title.trim()
    if (!title) return invalidPayload('Vui lòng nhập tên sự kiện.')
    if (!value.startsAt || !value.endsAt) return invalidPayload('Vui lòng nhập thời gian bắt đầu và kết thúc.')

    const start = new Date(value.startsAt)
    const end = new Date(value.endsAt)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return invalidPayload('Thời gian sự kiện không hợp lệ.')
    if (end <= start) return invalidPayload('Thời gian kết thúc phải sau thời gian bắt đầu.')

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Allinone//QR Code Generator//VI',
        'BEGIN:VEVENT',
        `SUMMARY:${escapeIcsValue(title)}`,
        `DTSTART:${formatIcsDateTime(value.startsAt)}`,
        `DTEND:${formatIcsDateTime(value.endsAt)}`,
    ]

    if (value.location.trim()) lines.push(`LOCATION:${escapeIcsValue(value.location.trim())}`)
    if (value.description.trim()) lines.push(`DESCRIPTION:${escapeIcsValue(value.description.trim())}`)
    lines.push('END:VEVENT', 'END:VCALENDAR')

    return {
        payload: lines.join('\r\n'),
        label: title,
        isUrlLike: false,
    }
}

function buildSocialPayload(value: QrFormValues['social']): QrPayloadResult {
    const input = value.value.trim()
    if (!input) return invalidPayload('Vui lòng nhập username, số điện thoại Zalo hoặc URL mạng xã hội.')

    const directUrl = normalizeHttpUrl(input)
    if (directUrl.ok) {
        return {
            payload: directUrl.url,
            label: getSocialPlatformName(value.platform),
            isUrlLike: true,
            normalizedUrl: directUrl.url,
        }
    }

    const handle = input.replace(/^@/, '').replace(/^\/+/, '')
    let url = ''

    switch (value.platform) {
        case 'facebook':
            url = `https://www.facebook.com/${encodeURIComponent(handle)}`
            break
        case 'instagram':
            url = `https://www.instagram.com/${encodeURIComponent(handle)}`
            break
        case 'youtube':
            url = `https://www.youtube.com/${input.startsWith('@') ? encodeURIComponent(input) : `@${encodeURIComponent(handle)}`}`
            break
        case 'tiktok':
            url = `https://www.tiktok.com/@${encodeURIComponent(handle)}`
            break
        case 'zalo': {
            const phone = normalizePhoneNumber(input)
            if (!phone) return invalidPayload('Zalo cần số điện thoại hợp lệ hoặc URL Zalo đầy đủ.')
            url = `https://zalo.me/${phone.replace(/^\+/, '')}`
            break
        }
    }

    return {
        payload: url,
        label: `${getSocialPlatformName(value.platform)} ${input}`,
        isUrlLike: true,
        normalizedUrl: url,
    }
}

function buildCryptoPayload(value: QrFormValues['crypto']): QrPayloadResult {
    const address = value.address.trim()
    if (!address) return invalidPayload('Vui lòng nhập địa chỉ ví crypto.')
    if (!/^[a-zA-Z0-9:_\-/.?=&%+]{16,180}$/.test(address)) return invalidPayload('Địa chỉ ví crypto có ký tự hoặc độ dài không hợp lệ.')

    const amount = value.amount.trim()
    if (amount && (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0)) return invalidPayload('Số lượng crypto không hợp lệ.')

    const label = value.label.trim()
    const params = new URLSearchParams()
    if (amount) params.set(value.network === 'ethereum' ? 'value' : 'amount', amount)
    if (label) params.set('label', label)

    if (value.network === 'custom') {
        return {
            payload: address,
            label: label || 'Crypto wallet',
            isUrlLike: false,
        }
    }

    return {
        payload: `${value.network}:${address}${params.toString() ? `?${params.toString()}` : ''}`,
        label: label || `${getCryptoNetworkName(value.network)} wallet`,
        isUrlLike: false,
    }
}

function buildFilePayload(value: QrFormValues['file']): QrPayloadResult {
    return buildUrlPayload(value.url, 'File download')
}

function buildAppPayload(value: QrFormValues['app']): QrPayloadResult {
    const input = value.value.trim()
    if (!input) return invalidPayload('Vui lòng nhập link app, App Store ID hoặc package name.')

    const directUrl = normalizeHttpUrl(input)
    if (directUrl.ok) {
        return {
            payload: directUrl.url,
            label: 'App link',
            isUrlLike: true,
            normalizedUrl: directUrl.url,
        }
    }

    let url = ''
    if (value.platform === 'play-store') {
        if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(input)) {
            return invalidPayload('Package name Android không hợp lệ. Ví dụ: com.company.app')
        }
        url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(input)}`
    } else if (value.platform === 'app-store') {
        const id = input.replace(/^id/i, '')
        if (!/^\d{6,12}$/.test(id)) return invalidPayload('App Store ID không hợp lệ. Ví dụ: 123456789')
        url = `https://apps.apple.com/app/id${id}`
    } else {
        return invalidPayload('Direct app cần URL hợp lệ.')
    }

    return {
        payload: url,
        label: value.platform === 'play-store' ? 'Google Play' : 'App Store',
        isUrlLike: true,
        normalizedUrl: url,
    }
}

function normalizeHttpUrl(value: string): { ok: true; url: string } | { ok: false; error: string } {
    let target = value.trim()
    if (!target) return { ok: false, error: 'Vui lòng nhập URL.' }
    if (/[\u0000-\u001f\u007f]/.test(target)) return { ok: false, error: 'URL không được chứa ký tự điều khiển.' }
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`

    try {
        const url = new URL(target)
        if (!['http:', 'https:'].includes(url.protocol)) return { ok: false, error: 'Chỉ hỗ trợ URL http hoặc https.' }
        if (!url.hostname || !url.hostname.includes('.')) return { ok: false, error: 'Hostname URL không hợp lệ.' }
        if (url.toString().length > 2048) return { ok: false, error: 'URL quá dài. Hãy giữ dưới 2.048 ký tự.' }

        return { ok: true, url: url.toString() }
    } catch {
        return { ok: false, error: 'URL không hợp lệ.' }
    }
}

function normalizePhoneNumber(value: string) {
    const cleaned = value.trim().replace(/[().\s-]/g, '')
    if (!cleaned) return ''

    if (/^0\d{8,10}$/.test(cleaned)) return `+84${cleaned.slice(1)}`
    if (/^84\d{8,10}$/.test(cleaned)) return `+${cleaned}`
    if (/^\+84\d{8,10}$/.test(cleaned)) return cleaned
    if (/^\+[1-9]\d{7,14}$/.test(cleaned)) return cleaned

    return ''
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

function escapeWifiValue(value: string) {
    return value.replace(/([\\;,:"])/g, '\\$1')
}

function escapeSmsText(value: string) {
    return value.replace(/[\r\n]+/g, ' ').slice(0, 500)
}

function escapeVcardValue(value: string) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
}

function escapeIcsValue(value: string) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
}

function formatIcsDateTime(value: string) {
    return value.replace(/[-:]/g, '').replace(/\.\d+/, '')
}

function getSocialPlatformName(platform: SocialPlatform) {
    const names: Record<SocialPlatform, string> = {
        facebook: 'Facebook',
        instagram: 'Instagram',
        youtube: 'YouTube',
        tiktok: 'TikTok',
        zalo: 'Zalo',
    }

    return names[platform]
}

function getCryptoNetworkName(network: CryptoNetwork) {
    const names: Record<CryptoNetwork, string> = {
        bitcoin: 'Bitcoin',
        ethereum: 'Ethereum',
        litecoin: 'Litecoin',
        dogecoin: 'Dogecoin',
        custom: 'Crypto',
    }

    return names[network]
}

function invalidPayload(error: string): QrPayloadResult {
    return {
        payload: '',
        label: 'QR Code',
        isUrlLike: false,
        error,
    }
}

function isQrErrorCorrectionLevel(value: unknown): value is QrErrorCorrectionLevel {
    return value === 'L' || value === 'M' || value === 'Q' || value === 'H'
}
