/**
 * API Route: Update Settings
 * PATCH /api/settings
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

export async function PATCH(request: NextRequest) {
    try {
        const supabase = (await createClient()) as SupabaseClient<Database>
        const { key, value } = await request.json() as { key: string, value: Database['public']['Tables']['settings']['Row']['value'] }

        // Update setting
        const { error } = await (supabase
            .from('settings') as any)
            .update({
                value,
                updated_at: new Date().toISOString(),
            })
            .eq('key', key)

        if (error) throw error

        // Log audit
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await (supabase.from('audit_logs') as any).insert({
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
