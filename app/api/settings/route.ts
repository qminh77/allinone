/**
 * API Route: Update Settings
 * PATCH /api/settings
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'
import { createAuditLog, getRequestInfo } from '@/lib/audit/log'

const EDITABLE_SETTINGS = new Set(['allow_registration', 'allow_login'])

export async function PATCH(request: NextRequest) {
    try {
        const supabase = (await createClient()) as SupabaseClient<Database>
        const { key, value } = await request.json() as { key: string, value: Database['public']['Tables']['settings']['Row']['value'] }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role:roles(name)')
            .eq('id', user.id)
            .single()

        const profileWithRole = profile as { role?: { name?: string } | { name?: string }[] } | null
        const role = Array.isArray(profileWithRole?.role) ? profileWithRole.role[0] : profileWithRole?.role
        if (!role || role.name !== 'Admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (!EDITABLE_SETTINGS.has(key)) {
            return NextResponse.json({ error: 'Unsupported setting key' }, { status: 400 })
        }

        if (
            typeof value !== 'object' ||
            value === null ||
            Array.isArray(value) ||
            typeof value.enabled !== 'boolean'
        ) {
            return NextResponse.json({ error: 'Invalid setting value' }, { status: 400 })
        }

        // Update setting
        const { error } = await (supabase
            .from('settings') as any)
            .update({
                value,
                updated_at: new Date().toISOString(),
            })
            .eq('key', key)

        if (error) throw error

        const { ipAddress, userAgent } = getRequestInfo(request)
        await createAuditLog({
            userId: user.id,
            action: 'settings.update',
            resourceType: 'settings',
            metadata: { key, value },
            ipAddress,
            userAgent,
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
