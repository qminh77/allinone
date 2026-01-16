/**
 * Security Headers Middleware
 * 
 * Adds security headers to all responses
 * - Content-Security-Policy (CSP)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 * - Strict-Transport-Security (HSTS)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
    request: NextRequest,
    response: NextResponse
): NextResponse {
    // Content Security Policy
    // Adjust based on your needs (e.g., if using external scripts/styles)
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for production
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.supabase.co http://127.0.0.1:54321 ws://127.0.0.1:54321",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ')

    response.headers.set('Content-Security-Policy', csp)

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY')

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff')

    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Permissions policy (restrict browser features)
    response.headers.set(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
    )

    // HSTS (only in production with HTTPS)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        )
    }

    // Remove server header (don't leak server info)
    response.headers.delete('X-Powered-By')

    return response
}

/**
 * Check if request is from same origin (CSRF protection)
 */
export function isSameOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (!origin) {
        // No origin header (same-origin requests from browsers may not include it)
        return true
    }

    try {
        const originUrl = new URL(origin)
        return originUrl.host === host
    } catch {
        return false
    }
}

/**
 * CSRF protection for state-changing requests
 */
export function checkCsrf(request: NextRequest): boolean {
    const method = request.method

    // Only check for state-changing methods
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        return true
    }

    // Check same-origin
    if (!isSameOrigin(request)) {
        return false
    }

    // Additional check: custom header (Next.js server actions include this)
    const hasCustomHeader = request.headers.has('next-action')
    const hasContentType = request.headers.get('content-type')?.includes('application/json')

    // Allow if it's a Next.js server action or has JSON content type
    return hasCustomHeader || hasContentType || false
}
