'use server'

import { promises as dns } from 'dns'
import { UrlSchema } from '@/lib/validation'
import * as cheerio from 'cheerio'
import ytdl from '@distube/ytdl-core'
import { execFile } from 'child_process'
import { constants as fsConstants, promises as fs } from 'fs'
import path from 'path'
import { promisify } from 'util'

export type DnsRecordType = 'A' | 'AAAA' | 'MX' | 'NS' | 'TXT' | 'CNAME' | 'SOA'

interface DnsResult {
    type: DnsRecordType
    data: string | object
    ttl?: number // Node dns module doesn't always return TTL easily with standard resolve methods, but we'll try standard resolve
}

type NormalizedUrl = { ok: true; url: string } | { ok: false; error: string }

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

export async function performDnsLookup(domain: string, type: DnsRecordType = 'A') {
    if (!domain) return { error: 'Domain is required' }

    // Basic validation
    const cleanDomain = domain.replace(/https?:\/\//, '').replace(/\/$/, '')

    try {
        let results: any = []

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
                results = await dns.resolveTxt(cleanDomain)
                // TXT returns array of arrays (chunks), join them
                results = results.map((chunks: string[]) => chunks.join(''))
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
    } catch (error: any) {
        // ENODATA means no records of this type found, which is a valid result (not a system error)
        if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
            return { success: true, data: [] }
        }
        return { error: `Lookup failed: ${error.code || error.message}` }
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

    } catch (error: any) {
        return { error: `System Error: ${error.message}` }
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
    } catch (error: any) {
        // Retry with GET if HEAD fails (some servers block HEAD)
        if (error.cause?.code === 'UND_ERR_HEADERS_TIMEOUT' || error.message.includes('HEAD')) {
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
            } catch (retryError: any) {
                return { error: `Lookup failed: ${retryError.message}` }
            }
        }
        return { error: `Lookup failed: ${error.message}` }
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
    } catch (error: any) {
        return { error: `Lookup failed: ${error.message}` }
    }
}

type VideoFormat = Awaited<ReturnType<typeof ytdl.getInfo>>['formats'][number]
const execFileAsync = promisify(execFile)
const YTDLP_TIMEOUT_MS = 60_000
const YTDLP_MAX_BUFFER = 24 * 1024 * 1024

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

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error)
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

    const { stdout } = await execFileAsync(binaryPath, [
        url,
        '--dump-single-json',
        '--no-check-certificates',
        '--no-warnings',
        '--prefer-free-formats',
        '--add-header', 'referer:youtube.com',
        '--add-header', 'user-agent:googlebot',
    ], {
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
                'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
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
        if (!isAllowedYouTubeHost(parsedUrl.hostname) || !ytdl.validateURL(normalized.url)) {
            return { error: 'Only YouTube URLs are supported' }
        }

        console.log(`[VideoDownloader] Fetching info for: ${normalized.url}`)

        try {
            const ytDlpData = await getVideoInfoWithYtDlp(normalized.url)
            if (ytDlpData) return { success: true, data: ytDlpData }
        } catch (ytDlpError) {
            console.warn('[VideoDownloader] Standalone yt-dlp failed, falling back to ytdl-core:', ytDlpError)
        }

        return { success: true, data: await getVideoInfoWithYtdlCore(normalized.url) }

    } catch (error) {
        console.error('[VideoDownloader] Error:', error)
        return { error: `Lỗi khi lấy thông tin video: ${getErrorMessage(error)}` }
    }
}
