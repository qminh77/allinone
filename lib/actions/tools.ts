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
        // Basic cleanup and protocol addition if needed
        let targetUrl = url.trim()
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl
        }

        const res = await fetch(targetUrl, {
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
                let targetUrl = url.trim()
                if (!/^https?:\/\//i.test(targetUrl)) {
                    targetUrl = 'https://' + targetUrl
                }
                const res = await fetch(targetUrl, { method: 'GET', redirect: 'manual' })
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
