/**
 * Input Validation Utilities
 * 
 * Validation schemas and helpers using Zod
 * Prevents SSRF, XSS, and other injection attacks
 */

import { z } from 'zod'
import net from 'net'

function isPrivateIPv4(hostname: string): boolean {
    const parts = hostname.split('.').map(part => Number(part))
    if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
        return false
    }

    const [a, b] = parts
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a >= 224
    )
}

function isBlockedHostname(hostname: string): boolean {
    const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '')

    if (
        normalized === 'localhost' ||
        normalized.endsWith('.localhost') ||
        normalized === 'metadata.google.internal' ||
        normalized === '169.254.169.254'
    ) {
        return true
    }

    const ipVersion = net.isIP(normalized)
    if (ipVersion === 4) {
        return isPrivateIPv4(normalized)
    }

    if (ipVersion === 6) {
        return (
            normalized === '::1' ||
            normalized === '::' ||
            normalized.startsWith('fc') ||
            normalized.startsWith('fd') ||
            normalized.startsWith('fe80:') ||
            normalized.startsWith('ff')
        )
    }

    return false
}

/**
 * URL validation with SSRF protection
 * Blocks localhost, private IPs, and dangerous protocols
 */
export const UrlSchema = z.string().url().refine(
    (url) => {
        try {
            const parsed = new URL(url)

            // Block dangerous protocols
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return false
            }

            // Avoid leaking credentials or allowing SSRF to local/private hosts.
            if (parsed.username || parsed.password || isBlockedHostname(parsed.hostname)) {
                return false
            }

            return true
        } catch {
            return false
        }
    },
    { message: 'Invalid or blocked URL. Only public HTTP/HTTPS URLs are allowed.' }
)

/**
 * Slug validation
 * Only lowercase letters, numbers, hyphens, and underscores
 */
export const SlugSchema = z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(
        /^[a-z0-9-_]+$/,
        'Slug can only contain lowercase letters, numbers, hyphens, and underscores'
    )

/**
 * Email validation
 */
export const EmailSchema = z.string()
    .email('Invalid email address')
    .max(255, 'Email too long')

/**
 * Password validation
 * Minimum 8 characters (will be strengthened in Phase 4)
 */
export const PasswordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')

/**
 * Sanitize HTML to prevent XSS
 * Basic sanitization - removes script tags and dangerous attributes
 */
export function sanitizeHtml(html: string): string {
    return html
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove event handlers
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
    return input
        .trim()
        .slice(0, maxLength)
        .replace(/[<>]/g, '') // Remove angle brackets
}

/**
 * Validate domain name
 */
export const DomainSchema = z.string()
    .min(3)
    .max(255)
    .regex(
        /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        'Invalid domain name'
    )

/**
 * Validate IP address (v4 or v6)
 */
export const IpSchema = z.string().refine(
    (ip) => {
        // IPv4
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
        if (ipv4Regex.test(ip)) {
            const parts = ip.split('.')
            return parts.every(part => parseInt(part) <= 255)
        }

        // IPv6 (simplified check)
        const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/
        return ipv6Regex.test(ip)
    },
    { message: 'Invalid IP address' }
)
