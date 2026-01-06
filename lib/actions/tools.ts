'use server'

import { promises as dns } from 'dns'

export type DnsRecordType = 'A' | 'AAAA' | 'MX' | 'NS' | 'TXT' | 'CNAME' | 'SOA'

interface DnsResult {
    type: DnsRecordType
    data: string | object
    ttl?: number // Node dns module doesn't always return TTL easily with standard resolve methods, but we'll try standard resolve
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
