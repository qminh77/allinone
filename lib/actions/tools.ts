'use server'

import { promises as dns } from 'dns'
import { UrlSchema } from '@/lib/validation'
import * as cheerio from 'cheerio'
import ytdl from '@distube/ytdl-core'
import { execFile } from 'child_process'
import { constants as fsConstants, promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { promisify } from 'util'

export type DnsRecordType = 'A' | 'AAAA' | 'MX' | 'NS' | 'TXT' | 'CNAME' | 'SOA'

type DnsLookupResult = string[] | Awaited<ReturnType<typeof dns.resolveMx>> | Awaited<ReturnType<typeof dns.resolveSoa>>

type NormalizedUrl = { ok: true; url: string } | { ok: false; error: string }

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message
    }

    if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
        return (error as { message: string }).message
    }

    return String(error)
}

function getErrorCode(error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string') {
        return (error as { code: string }).code
    }

    return undefined
}

function getErrorCauseCode(error: unknown) {
    if (!error || typeof error !== 'object' || !('cause' in error)) {
        return undefined
    }

    const cause = (error as { cause?: unknown }).cause
    if (!cause || typeof cause !== 'object' || !('code' in cause) || typeof (cause as { code?: unknown }).code !== 'string') {
        return undefined
    }

    return (cause as { code: string }).code
}

function normalizePublicUrl(input: string): NormalizedUrl {
    let targetUrl = input.trim()
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl
    }

    const validation = UrlSchema.safeParse(targetUrl)
    if (!validation.success) {
        return { ok: false, error: validation.error.issues[0].message }
    }

    return { ok: true, url: validation.data }
}

function isAllowedYouTubeHost(hostname: string) {
    const normalized = hostname.toLowerCase()
    return normalized === 'youtube.com' ||
        normalized.endsWith('.youtube.com') ||
        normalized === 'youtu.be'
}

function extractYouTubeVideoId(url: URL) {
    const hostname = url.hostname.toLowerCase()
    const pathnameParts = url.pathname.split('/').filter(Boolean)

    if (hostname === 'youtu.be') {
        return pathnameParts[0]
    }

    if (url.pathname === '/watch') {
        return url.searchParams.get('v')
    }

    if (['shorts', 'embed', 'live'].includes(pathnameParts[0])) {
        return pathnameParts[1]
    }

    return null
}

function normalizeYouTubeVideoUrl(url: string): NormalizedUrl {
    const parsed = new URL(url)
    const videoId = extractYouTubeVideoId(parsed)

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return { ok: false, error: 'Only single YouTube video URLs are supported' }
    }

    return { ok: true, url: `https://www.youtube.com/watch?v=${videoId}` }
}

export async function performDnsLookup(domain: string, type: DnsRecordType = 'A') {
    if (!domain) return { error: 'Domain is required' }

    // Basic validation
    const cleanDomain = domain.replace(/https?:\/\//, '').replace(/\/$/, '')

    try {
        let results: DnsLookupResult = []

        switch (type) {
            case 'A':
                results = await dns.resolve4(cleanDomain)
                break
            case 'AAAA':
                results = await dns.resolve6(cleanDomain)
                break
            case 'MX':
                results = await dns.resolveMx(cleanDomain)
                break
            case 'NS':
                results = await dns.resolveNs(cleanDomain)
                break
            case 'TXT':
                // TXT returns array of arrays (chunks), join them
                results = (await dns.resolveTxt(cleanDomain)).map((chunks) => chunks.join(''))
                break
            case 'CNAME':
                results = await dns.resolveCname(cleanDomain)
                break
            case 'SOA':
                results = await dns.resolveSoa(cleanDomain)
                break
            default:
                return { error: 'Unsupported record type' }
        }

        return { success: true, data: results }
    } catch (error: unknown) {
        // ENODATA means no records of this type found, which is a valid result (not a system error)
        const code = getErrorCode(error)
        if (code === 'ENODATA' || code === 'ENOTFOUND') {
            return { success: true, data: [] }
        }
        return { error: `Lookup failed: ${code || getErrorMessage(error)}` }
    }
}

export async function performIpLookup(query: string = '') {
    try {
        // Validation: slightly loose to allow domains which the API might handle, 
        // but robust enough to prevent obvious injection or massive strings.
        if (query && query.length > 255) {
            return { error: 'Input too long' }
        }

        // api-ip.com endpoint
        const response = await fetch(`http://ip-api.com/json/${query}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
            // Cache for a bit to be nice to the free API
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            return { error: `API Error: ${response.statusText}` }
        }

        const data = await response.json()

        if (data.status === 'fail') {
            return { error: `Lookup failed: ${data.message}` }
        }

        return { success: true, data }

    } catch (error: unknown) {
        return { error: `System Error: ${getErrorMessage(error)}` }
    }
}


export async function performHeaderLookup(url: string) {
    if (!url) return { error: 'URL is required' }

    try {
        const normalized = normalizePublicUrl(url)
        if (!normalized.ok) return { error: normalized.error }

        const res = await fetch(normalized.url, {
            method: 'HEAD',
            redirect: 'manual', // Don't follow redirects automatically so we see the 301/302
            // headers: { 'User-Agent': ... } // Optional: pretend to be a browser
        })

        // Depending on redirect mode 'manual', we might get an opaque response or a 0 status 
        // if mode was 'no-cors' (but we can't use no-cors if we want headers).
        // With 'manual', Next.js server actions might throw or return weird stuff depending on environment.
        // Actually, 'manual' redirection in fetch API returns the redirect response status (3xx) 
        // and we can see the Location header.

        // We can safely return headers
        const headers: Record<string, string> = {}
        res.headers.forEach((val, key) => {
            headers[key] = val
        })

        return {
            success: true,
            data: {
                status: res.status,
                statusText: res.statusText,
                headers,
                url: res.url
            }
        }
    } catch (error: unknown) {
        // Retry with GET if HEAD fails (some servers block HEAD)
        const causeCode = getErrorCauseCode(error)
        const message = getErrorMessage(error)
        if (causeCode === 'UND_ERR_HEADERS_TIMEOUT' || message.includes('HEAD')) {
            try {
                const normalized = normalizePublicUrl(url)
                if (!normalized.ok) return { error: normalized.error }
                const res = await fetch(normalized.url, { method: 'GET', redirect: 'manual' })
                const headers: Record<string, string> = {}
                res.headers.forEach((val, key) => {
                    headers[key] = val
                })
                return {
                    success: true,
                    data: {
                        status: res.status,
                        statusText: res.statusText,
                        headers,
                        url: res.url
                    }
                }
            } catch (retryError: unknown) {
                return { error: `Lookup failed: ${getErrorMessage(retryError)}` }
            }
        }
        return { error: `Lookup failed: ${message}` }
    }
}

export async function performMetaTagLookup(url: string) {
    if (!url) return { error: 'URL is required' }

    try {
        const normalized = normalizePublicUrl(url)
        if (!normalized.ok) return { error: normalized.error }

        const res = await fetch(normalized.url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; UmtersBot/1.0; +https://umters.club)'
            }
        })

        if (!res.ok) {
            return { error: `Failed to fetch URL: ${res.status} ${res.statusText}` }
        }

        const html = await res.text()
        const $ = cheerio.load(html)

        const data = {
            title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
            description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
            keywords: $('meta[name="keywords"]').attr('content') || '',
            og: {
                title: $('meta[property="og:title"]').attr('content'),
                description: $('meta[property="og:description"]').attr('content'),
                image: $('meta[property="og:image"]').attr('content'),
                url: $('meta[property="og:url"]').attr('content'),
                site_name: $('meta[property="og:site_name"]').attr('content'),
                type: $('meta[property="og:type"]').attr('content'),
            },
            twitter: {
                card: $('meta[name="twitter:card"]').attr('content'),
                title: $('meta[name="twitter:title"]').attr('content'),
                description: $('meta[name="twitter:description"]').attr('content'),
                image: $('meta[name="twitter:image"]').attr('content'),
                site: $('meta[name="twitter:site"]').attr('content'),
            },
            favicon: $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href'),
            canonical: $('link[rel="canonical"]').attr('href')
        }

        return {
            success: true,
            data
        }
    } catch (error: unknown) {
        return { error: `Lookup failed: ${getErrorMessage(error)}` }
    }
}

type VideoFormat = Awaited<ReturnType<typeof ytdl.getInfo>>['formats'][number]
const execFileAsync = promisify(execFile)
const YTDLP_TIMEOUT_MS = 60_000
const YTDLP_MAX_BUFFER = 24 * 1024 * 1024
const YOUTUBE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const YOUTUBE_BOT_CHALLENGE_TEXT = 'YouTube đang yêu cầu xác minh bot trên môi trường serverless. Trên Vercel cần cấu hình cookies YouTube cho yt-dlp bằng biến môi trường YTDLP_COOKIES_BASE64 hoặc YTDLP_COOKIES.'

function formatDuration(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return ''

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    if (hours > 0) {
        return [hours, minutes, remainingSeconds]
            .map((part) => String(part).padStart(2, '0'))
            .join(':')
    }

    return [minutes, remainingSeconds]
        .map((part) => String(part).padStart(2, '0'))
        .join(':')
}

function parseContentLength(contentLength?: string) {
    if (!contentLength) return undefined
    const parsed = Number(contentLength)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function mapYtdlFormat(format: VideoFormat) {
    return {
        format_id: String(format.itag),
        url: format.url,
        protocol: format.isHLS ? 'm3u8_native' : 'https',
        height: format.height,
        width: format.width,
        fps: format.fps,
        resolution: format.hasVideo ? format.qualityLabel : 'Audio',
        ext: format.container,
        vcodec: format.hasVideo ? (format.videoCodec || 'unknown') : 'none',
        acodec: format.hasAudio ? (format.audioCodec || 'unknown') : 'none',
        filesize: parseContentLength(format.contentLength),
        tbr: format.bitrate || format.averageBitrate,
    }
}

function getCommandErrorOutput(error: unknown) {
    if (error && typeof error === 'object') {
        const stderr = 'stderr' in error ? error.stderr : undefined
        const stdout = 'stdout' in error ? error.stdout : undefined

        if (typeof stderr === 'string' && stderr.trim()) return stderr
        if (typeof stdout === 'string' && stdout.trim()) return stdout
    }

    return getErrorMessage(error)
}

function isYouTubeBotChallenge(error: unknown) {
    const message = getCommandErrorOutput(error).toLowerCase()
    return message.includes('sign in to confirm') ||
        message.includes('not a bot') ||
        message.includes('use --cookies') ||
        message.includes('cookies-from-browser')
}

async function getYtDlpBinaryPath() {
    const candidates = [
        process.env.YTDLP_BINARY_PATH,
        path.join(process.cwd(), 'bin', 'yt-dlp'),
    ].filter(Boolean) as string[]

    for (const candidate of candidates) {
        try {
            await fs.access(candidate, fsConstants.X_OK)
            return candidate
        } catch {
            // Continue to the next configured location.
        }
    }

    return null
}

async function getYtDlpCookiesPath() {
    if (process.env.YTDLP_COOKIES_FILE) {
        return process.env.YTDLP_COOKIES_FILE
    }

    const cookiesText = process.env.YTDLP_COOKIES_BASE64
        ? Buffer.from(process.env.YTDLP_COOKIES_BASE64, 'base64').toString('utf8')
        : process.env.YTDLP_COOKIES

    if (!cookiesText?.trim()) {
        return null
    }

    const cookiesDir = path.join(os.tmpdir(), 'allinone', 'yt-dlp')
    const cookiesPath = path.join(cookiesDir, `cookies-${process.pid}.txt`)

    await fs.mkdir(cookiesDir, { recursive: true })
    await fs.writeFile(cookiesPath, cookiesText, { mode: 0o600 })

    return cookiesPath
}

type YtDlpOutput = Record<string, unknown> & {
    duration?: unknown
    duration_string?: unknown
    formats?: unknown
}

function normalizeYtDlpOutput(output: YtDlpOutput) {
    const duration = Number(output.duration)

    return {
        ...output,
        duration,
        duration_string: typeof output.duration_string === 'string'
            ? output.duration_string
            : formatDuration(duration),
        formats: Array.isArray(output.formats) ? output.formats : [],
    }
}

async function getVideoInfoWithYtDlp(url: string) {
    const binaryPath = await getYtDlpBinaryPath()
    if (!binaryPath) return null

    const args = [
        url,
        '--dump-single-json',
        '--no-playlist',
        '--no-check-certificates',
        '--no-warnings',
        '--prefer-free-formats',
        '--socket-timeout', '20',
        '--add-header', 'referer:youtube.com',
        '--add-header', `user-agent:${YOUTUBE_USER_AGENT}`,
    ]

    const cookiesPath = await getYtDlpCookiesPath()
    if (cookiesPath) {
        args.push('--cookies', cookiesPath)
    }

    const { stdout } = await execFileAsync(binaryPath, args, {
        timeout: YTDLP_TIMEOUT_MS,
        maxBuffer: YTDLP_MAX_BUFFER,
    })

    return normalizeYtDlpOutput(JSON.parse(stdout))
}

async function getVideoInfoWithYtdlCore(url: string) {
    process.env.YTDL_NO_UPDATE ||= '1'

    const info = await ytdl.getInfo(url, {
        requestOptions: {
            headers: {
                referer: 'https://www.youtube.com',
                'user-agent': YOUTUBE_USER_AGENT,
            },
        },
    })

    const details = info.videoDetails
    const duration = Number(details.lengthSeconds)
    const thumbnail = details.thumbnails
        ?.slice()
        .sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url

    return {
        id: details.videoId,
        title: details.title,
        uploader: details.author?.name || '',
        thumbnail,
        duration,
        duration_string: formatDuration(duration),
        formats: info.formats
            .filter((format) => format.url && !format.isLive)
            .map(mapYtdlFormat),
    }
}

export async function getVideoInfo(url: string) {
    try {
        if (!url) return { error: 'URL is required' }

        const normalized = normalizePublicUrl(url)
        if (!normalized.ok) return { error: normalized.error }

        const parsedUrl = new URL(normalized.url)
        if (!isAllowedYouTubeHost(parsedUrl.hostname)) {
            return { error: 'Only YouTube URLs are supported' }
        }

        const videoUrl = normalizeYouTubeVideoUrl(normalized.url)
        if (!videoUrl.ok) return { error: videoUrl.error }

        if (!ytdl.validateURL(videoUrl.url)) {
            return { error: 'Only YouTube video URLs are supported' }
        }

        console.log(`[VideoDownloader] Fetching info for: ${videoUrl.url}`)

        let ytDlpFailure: unknown = null
        try {
            const ytDlpData = await getVideoInfoWithYtDlp(videoUrl.url)
            if (ytDlpData) return { success: true, data: ytDlpData }
        } catch (ytDlpError) {
            ytDlpFailure = ytDlpError
            console.warn('[VideoDownloader] Standalone yt-dlp failed, falling back to ytdl-core:', ytDlpError)
        }

        try {
            return { success: true, data: await getVideoInfoWithYtdlCore(videoUrl.url) }
        } catch (ytdlError) {
            if (ytDlpFailure && isYouTubeBotChallenge(ytDlpFailure)) {
                return { error: YOUTUBE_BOT_CHALLENGE_TEXT }
            }

            throw ytdlError
        }

    } catch (error) {
        console.error('[VideoDownloader] Error:', error)
        return { error: `Lỗi khi lấy thông tin video: ${getErrorMessage(error)}` }
    }
}
