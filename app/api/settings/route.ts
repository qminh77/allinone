/**
 * API Route: Update Settings
 * PATCH /api/settings
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { key, value } = await request.json()

        // Update setting
        const { error } = await (supabase as any)
            .from('settings')
            .update({
                value,
                updated_at: new Date().toISOString(),
            })
            .eq('key', key)

        if (error) throw error

        // Log audit
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await (supabase as any).from('audit_logs').insert({
                user_id: user.id,
                action: 'settings.update',
                metadata: { key, value },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
