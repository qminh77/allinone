'use server'

import net from 'net'

export interface WhoisResult {
    raw: string
    registrar?: string
    creationDate?: string
    expiryDate?: string
    domainName?: string
}

export type WhoisLookupResponse = {
    success: boolean
    data?: WhoisResult
    error?: string
}

async function queryWhoisServer(host: string, domain: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection(43, host, () => {
            socket.write(domain + '\r\n')
        })

        let data = ''

        socket.on('data', (chunk) => {
            data += chunk
        })

        socket.on('end', () => {
            resolve(data)
        })

        socket.on('error', (err) => {
            reject(err)
        })

        socket.setTimeout(10000, () => {
            socket.destroy()
            reject(new Error('Timeout connecting to WHOIS server'))
        })
    })
}

function parseWhoisData(raw: string): WhoisResult {
    const result: WhoisResult = { raw }

    // Simple regex parsing for common fields - heuristics
    // This is not perfect as WHOIS formats vary wildly

    // Registrar
    const registrarMatch = raw.match(/Registrar:\s*(.+)/i) || raw.match(/Sponsoring Registrar:\s*(.+)/i)
    if (registrarMatch) result.registrar = registrarMatch[1].trim()

    // Creation Date
    const creationMatch = raw.match(/Creation Date:\s*(.+)/i) || raw.match(/Created on:\s*(.+)/i) || raw.match(/Registered on:\s*(.+)/i)
    if (creationMatch) result.creationDate = creationMatch[1].trim()

    // Expiry Date
    const expiryMatch = raw.match(/Registry Expiry Date:\s*(.+)/i) || raw.match(/Expiry Date:\s*(.+)/i) || raw.match(/Expires on:\s*(.+)/i)
    if (expiryMatch) result.expiryDate = expiryMatch[1].trim()

    // Domain Name
    const domainMatch = raw.match(/Domain Name:\s*(.+)/i)
    if (domainMatch) result.domainName = domainMatch[1].trim()

    return result
}

export async function performWhoisLookup(domain: string): Promise<WhoisLookupResponse> {
    try {
        if (!domain) return { success: false, error: 'Domain is required' }

        // Sanitize
        const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')

        // 1. Query IANA/Root first to find TLD server
        // Logic: Most TLDs are handled by IANA whois first which refers to specific TLD WHOIS
        // Exceptions: Some generic TLDs might work directly with whois.verisign-grs.com for .com/.net

        // Simpler approach: Try whois.iana.org first
        let currentServer = 'whois.iana.org'
        let rawData = await queryWhoisServer(currentServer, cleanDomain)

        // Check for referral
        // Pattern: "refer: whois.nic.google" or "whois: whois.verisign-grs.com"
        let referMatch = rawData.match(/refer:\s*(.+)/i) || rawData.match(/whois:\s*(.+)/i)

        if (referMatch) {
            currentServer = referMatch[1].trim()
            // Query the referred server
            rawData = await queryWhoisServer(currentServer, cleanDomain)
        } else {
            // Fallback for .com/.net if IANA didn't give a referral (rare for IANA, but common if we queried something else)
            // Or maybe we need to parse TLD and pick a server manually if IANA fails?
            // heuristic: if output is very short/empty, maybe try common servers
            if (cleanDomain.endsWith('.com') && !rawData.includes('Domain Name:')) {
                rawData = await queryWhoisServer('whois.verisign-grs.com', cleanDomain)
            }
        }

        // Some TLDs have a second layer (Registrar WHOIS).
        // e.g. .com from Verisign might say "Registrar WHOIS Server: whois.markmonitor.com"
        const registrarServerMatch = rawData.match(/Registrar WHOIS Server:\s*(.+)/i)
        if (registrarServerMatch) {
            const registrarServer = registrarServerMatch[1].trim()
            if (registrarServer && registrarServer !== currentServer) {
                const extraData = await queryWhoisServer(registrarServer, cleanDomain)
                // Start with the specific data, append the registry data
                rawData = extraData + '\n\n--- Registry Data ---\n\n' + rawData
            }
        }

        const parsed = parseWhoisData(rawData)
        return { success: true, data: parsed }

    } catch (error: any) {
        return { success: false, error: error.message || 'Unknown error occurred' }
    }
}
