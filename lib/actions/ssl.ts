'use server'

import tls from 'tls'
import { URL } from 'url'

export interface SslInfo {
    host: string
    valid: boolean
    daysRemaining: number
    validFrom: string
    validTo: string
    issuer: string
    subject: string
    serialNumber: string
    fingerprint: string
}

export type SslLookupResult = {
    success: boolean
    data?: SslInfo
    error?: string
}

export async function performSslLookup(domain: string): Promise<SslLookupResult> {
    try {
        if (!domain) return { success: false, error: 'Domain is required' }

        // Clean domain
        let hostname = domain.trim()
        if (hostname.startsWith('https://')) hostname = new URL(hostname).hostname
        if (hostname.startsWith('http://')) hostname = new URL(hostname).hostname

        return new Promise((resolve) => {
            const socket = tls.connect({
                host: hostname,
                port: 443,
                servername: hostname,
                rejectUnauthorized: false // We just want to inspect the cert, not fail if it's self-signed (though we can flag it)
            }, () => {
                const cert = socket.getPeerCertificate()
                if (!cert || Object.keys(cert).length === 0) {
                    socket.end()
                    resolve({ success: false, error: 'No certificate found' })
                    return
                }

                const validFrom = new Date(cert.valid_from)
                const validTo = new Date(cert.valid_to)
                const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

                const info: SslInfo = {
                    host: hostname,
                    valid: daysRemaining > 0, // simplistic check, could also check validFrom
                    daysRemaining,
                    validFrom: validFrom.toISOString(),
                    validTo: validTo.toISOString(),
                    issuer: (cert.issuer as any).O || (cert.issuer as any).CN || 'Unknown',
                    subject: (cert.subject as any).CN || 'Unknown',
                    serialNumber: cert.serialNumber,
                    fingerprint: cert.fingerprint
                }

                socket.end()
                resolve({ success: true, data: info })
            })

            socket.on('error', (err) => {
                resolve({ success: false, error: err.message })
            })

            socket.setTimeout(5000, () => {
                socket.destroy()
                resolve({ success: false, error: 'Connection timed out' })
            })
        })
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
