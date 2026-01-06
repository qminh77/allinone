'use server'

import net from 'net'

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

export async function pingSite(url: string): Promise<PingResult> {
    const start = performance.now()
    try {
        // Ensure protocol
        if (!url.startsWith('http')) {
            url = 'https://' + url
        }

        const res = await fetch(url, {
            method: 'HEAD',
            cache: 'no-store',
            // short timeout 5s
            signal: AbortSignal.timeout(5000)
        })

        const end = performance.now()
        const latency = Math.round(end - start)

        return {
            host: url,
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
                host,
                port,
                status: 'open',
                latency: Math.round(end - start)
            })
        })

        socket.on('timeout', () => {
            cleanup()
            resolve({
                host,
                port,
                status: 'closed',
                latency: 0,
                error: 'Connection timed out'
            })
        })

        socket.on('error', (err) => {
            cleanup()
            resolve({
                host,
                port,
                status: 'closed',
                latency: 0,
                error: err.message
            })
        })

        socket.connect(port, host)
    })
}
