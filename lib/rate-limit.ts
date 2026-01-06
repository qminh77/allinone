/**
 * Rate Limiting Utilities
 * 
 * Uses Upstash Redis for distributed rate limiting
 * Supports multiple rate limit strategies
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null

/**
 * Check if request exceeds rate limit
 * @param key - Unique identifier for rate limit (e.g., 'login:user@email.com' or 'api:ip-address')
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @throws Error if rate limit exceeded
 */
export async function checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
): Promise<void> {
    // If Redis not configured, skip rate limiting (dev mode)
    if (!redis) {
        console.warn('Rate limiting disabled: Redis not configured')
        return
    }

    try {
        const fullKey = `ratelimit:${key}`

        // Increment counter
        const count = await redis.incr(fullKey)

        // Set expiry on first request
        if (count === 1) {
            await redis.expire(fullKey, windowSeconds)
        }

        // Check if limit exceeded
        if (count > limit) {
            const ttl = await redis.ttl(fullKey)
            throw new Error(
                `Rate limit exceeded. Please try again in ${ttl} seconds.`
            )
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
            throw error
        }
        // Log other errors but don't block request
        console.error('Rate limit check error:', error)
    }
}

/**
 * Get current rate limit info
 * @param key - Rate limit key
 * @returns Current count and reset time
 */
export async function getRateLimitInfo(key: string): Promise<{
    count: number
    resetIn: number
    limit?: number
}> {
    if (!redis) {
        return { count: 0, resetIn: 0 }
    }

    try {
        const fullKey = `ratelimit:${key}`
        const count = await redis.get<number>(fullKey)
        const ttl = await redis.ttl(fullKey)

        return {
            count: count || 0,
            resetIn: ttl > 0 ? ttl : 0
        }
    } catch (error) {
        console.error('Get rate limit info error:', error)
        return { count: 0, resetIn: 0 }
    }
}

/**
 * Reset rate limit for a key
 * @param key - Rate limit key to reset
 */
export async function resetRateLimit(key: string): Promise<void> {
    if (!redis) return

    try {
        const fullKey = `ratelimit:${key}`
        await redis.del(fullKey)
    } catch (error) {
        console.error('Reset rate limit error:', error)
    }
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimits = {
    // Authentication
    LOGIN: { limit: 5, window: 300 }, // 5 attempts per 5 minutes
    REGISTER: { limit: 3, window: 3600 }, // 3 registrations per hour
    PASSWORD_RESET: { limit: 3, window: 3600 }, // 3 resets per hour

    // API endpoints
    API_GENERAL: { limit: 100, window: 60 }, // 100 requests per minute
    API_STRICT: { limit: 10, window: 60 }, // 10 requests per minute

    // Shortlinks
    SHORTLINK_CREATE: { limit: 20, window: 3600 }, // 20 shortlinks per hour
    SHORTLINK_PASSWORD_VERIFY: { limit: 5, window: 60 }, // 5 password attempts per minute

    // Mail
    MAIL_SEND: { limit: 10, window: 3600 }, // 10 emails per hour
} as const

/**
 * Helper to get client identifier (IP or user ID)
 * @param request - Next.js Request object
 * @param userId - Optional authenticated user ID
 * @returns Identifier string for rate limiting
 */
export function getClientIdentifier(request: Request, userId?: string): string {
    if (userId) return userId

    // Get IP from headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

    return `ip:${ip}`
}
