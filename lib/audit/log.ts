/**
 * Audit Log Utilities
 * 
 * Ghi nhật ký các hành động quan trọng trong hệ thống
 */

import { createAdminClient } from '@/lib/supabase/admin'

export type AuditAction =
    | 'login'
    | 'logout'
    | 'register'
    | 'user.create'
    | 'user.update'
    | 'user.delete'
    | 'user.assign_role'
    | 'role.create'
    | 'role.update'
    | 'role.delete'
    | 'role.assign_permissions'
    | 'permission.create'
    | 'permission.delete'
    | 'module.enable'
    | 'module.disable'
    | 'settings.update'
    | 'backup.create'
    | 'backup.restore'

export interface CreateAuditLogParams {
    userId?: string | null
    action: AuditAction
    resourceType?: string
    resourceId?: string
    metadata?: Record<string, any>
    ipAddress?: string
    userAgent?: string
}

/**
 * Tạo audit log
 * ⚠️ Hàm này dùng admin client để bypass RLS
 * Chỉ gọi từ API routes
 */
export async function createAuditLog(params: CreateAuditLogParams) {
    try {
        const supabase = createAdminClient()

        const { error } = await supabase.from('audit_logs').insert({
            user_id: params.userId || null,
            action: params.action,
            resource_type: params.resourceType || null,
            resource_id: params.resourceId || null,
            metadata: params.metadata || null,
            ip_address: params.ipAddress || null,
            user_agent: params.userAgent || null,
        })

        if (error) {
            console.error('Error creating audit log:', error)
        }
    } catch (error) {
        console.error('Failed to create audit log:', error)
    }
}

/**
 * Helper để lấy IP và User Agent từ Next.js Request
 */
export function getRequestInfo(request: Request) {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    return { ipAddress, userAgent }
}
