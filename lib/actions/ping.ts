'use server'

import net from 'net'
import { UrlSchema } from '@/lib/validation'

export interface PingResult {
    host: string
    status: 'online' | 'offline'
    latency: number
    statusCode?: number
    error?: string
}

export interface PortCheckResult {
    host: string
    port: number
    status: 'open' | 'closed'
    latency: number
    error?: string
}

type NormalizedUrl = { ok: true; url: string } | { ok: false; error: string }
type NormalizedHost = { ok: true; host: string } | { ok: false; error: string }

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

function normalizePublicHost(input: string): NormalizedHost {
    const normalized = normalizePublicUrl(input)
    if (!normalized.ok) return { ok: false, error: normalized.error }

    return { ok: true, host: new URL(normalized.url).hostname }
}

export async function pingSite(url: string): Promise<PingResult> {
    const start = performance.now()
    try {
        const normalized = normalizePublicUrl(url)
        if (!normalized.ok) {
            return {
                host: url,
                status: 'offline',
                latency: 0,
                error: normalized.error
            }
        }

        const res = await fetch(normalized.url,
            {
            method: 'HEAD',
            cache: 'no-store',
            // short timeout 5s
            signal: AbortSignal.timeout(5000)
        })

        const end = performance.now()
        const latency = Math.round(end - start)

        return {
            host: normalized.url,
            status: 'online',
            latency,
            statusCode: res.status
        }

    } catch (error: any) {
        return {
            host: url,
            status: 'offline',
            latency: 0,
            error: error.message || 'Connection failed'
        }
    }
}

export async function checkPort(host: string, port: number): Promise<PortCheckResult> {
    const normalized = normalizePublicHost(host)
    if (!normalized.ok) {
        return {
            host,
            port,
            status: 'closed',
            latency: 0,
            error: normalized.error
        }
    }

    return new Promise((resolve) => {
        const start = performance.now()
        const socket = new net.Socket()

        const cleanup = () => {
            socket.destroy()
        }

        socket.setTimeout(3000) // 3s timeout

        socket.on('connect', () => {
            const end = performance.now()
            cleanup()
            resolve({
                host: normalized.host,
                port,
                status: 'open',
                latency: Math.round(end - start)
            })
        })

        socket.on('timeout', () => {
            cleanup()
            resolve({
                host: normalized.host,
                port,
                status: 'closed',
                latency: 0,
                error: 'Connection timed out'
            })
        })

        socket.on('error', (err) => {
            cleanup()
            resolve({
                host: normalized.host,
                port,
                status: 'closed',
                latency: 0,
                error: err.message
            })
        })

        socket.connect(port, normalized.host)
    })
}
