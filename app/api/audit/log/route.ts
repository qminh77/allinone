/**
 * API Route: Audit Log
 * POST /api/audit/log
 */

import { NextResponse } from 'next/server'
import { createAuditLog, getRequestInfo } from '@/lib/audit/log'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { ipAddress, userAgent } = getRequestInfo(request)

        await createAuditLog({
            userId: body.userId,
            action: body.action,
            resourceType: body.resourceType,
            resourceId: body.resourceId,
            metadata: body.metadata,
            ipAddress,
            userAgent,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Audit log error:', error)
        return NextResponse.json(
            { error: 'Failed to create audit log' },
            { status: 500 }
        )
    }
}
