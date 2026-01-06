/**
 * Security Monitoring Utilities
 * 
 * Logs security-related events to Audit Log with severity levels.
 * Can be extended to send alerts (Slack, Discord, Email).
 */

import { createAuditLog } from '@/lib/audit/log'

export type SecurityEventType =
    | 'failed_login'
    | 'permission_denied'
    | 'suspicious_activity'
    | 'rate_limit_exceeded'
    | 'admin_action'

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Log a security event
 */
export async function logSecurityEvent(
    event: SecurityEventType,
    details: Record<string, any>,
    request?: Request
) {
    const severity = getSeverity(event)

    // Extract IP/UserAgent if request provided
    let ipAddress, userAgent
    if (request) {
        // Simple extraction, relying on audit log utils would be better but keeping simple deps
        ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
        userAgent = request.headers.get('user-agent') || 'unknown'
    }

    try {
        await createAuditLog({
            userId: details.userId || 'system',
            action: `security.${event}`,
            resourceType: 'security_event',
            resourceId: details.resourceId || 'system',
            metadata: {
                ...details,
                severity,
                timestamp: new Date().toISOString()
            },
            ipAddress,
            userAgent
        })

        // TODO: Implement external alerting here (e.g. Slack webhook)
        if (severity === 'critical') {
            console.error(`[CRITICAL SECURITY ALERT] ${event}`, details)
        }

    } catch (error) {
        // Don't crash app if logging fails, but log to console
        console.error('Failed to log security event:', error)
    }
}

function getSeverity(event: SecurityEventType): SecurityEventSeverity {
    switch (event) {
        case 'suspicious_activity':
            return 'critical'
        case 'permission_denied':
        case 'rate_limit_exceeded':
            return 'high'
        case 'failed_login':
            return 'medium'
        case 'admin_action':
            return 'low'
        default:
            return 'low'
    }
}
