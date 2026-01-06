/**
 * Error Response Utilities
 * 
 * Sanitize error messages to prevent information leakage
 * Production errors should be generic, detailed errors only in development
 */

/**
 * Sanitize error message for client
 * Prevents leaking sensitive information like database schema, file paths, etc.
 */
export function sanitizeErrorMessage(error: unknown): string {
    if (process.env.NODE_ENV === 'development') {
        // In development, show detailed errors
        if (error instanceof Error) {
            return error.message
        }
        return String(error)
    }

    // In production, return generic messages
    if (error instanceof Error) {
        // Check for known safe error messages
        const safeErrors = [
            'Unauthorized',
            'Forbidden',
            'Not found',
            'Invalid input',
            'Rate limit exceeded',
            'Missing required fields',
            'Invalid credentials',
        ]

        // If error message starts with a safe prefix, allow it
        if (safeErrors.some(safe => error.message.startsWith(safe))) {
            return error.message
        }
    }

    // Default generic error
    return 'An error occurred. Please try again later.'
}

/**
 * Log error securely (don't log sensitive data)
 */
export function logError(
    error: unknown,
    context?: {
        userId?: string
        action?: string
        metadata?: Record<string, any>
    }
) {
    const timestamp = new Date().toISOString()
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('[ERROR]', {
        timestamp,
        message: errorMessage,
        stack: errorStack,
        context: {
            userId: context?.userId || 'anonymous',
            action: context?.action || 'unknown',
            // Don't log sensitive metadata
            metadata: sanitizeMetadata(context?.metadata),
        },
    })
}

/**
 * Sanitize metadata to remove sensitive fields
 */
function sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> {
    if (!metadata) return {}

    const sensitiveKeys = [
        'password',
        'token',
        'secret',
        'key',
        'authorization',
        'cookie',
        'session',
    ]

    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(metadata)) {
        const lowerKey = key.toLowerCase()
        const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))

        if (isSensitive) {
            sanitized[key] = '[REDACTED]'
        } else {
            sanitized[key] = value
        }
    }

    return sanitized
}

/**
 * Create safe error response for API routes
 */
export function createErrorResponse(
    error: unknown,
    statusCode: number = 500
): Response {
    const message = sanitizeErrorMessage(error)

    return new Response(
        JSON.stringify({ error: message }),
        {
            status: statusCode,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    )
}
