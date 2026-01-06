import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if profile exists
        const adminClient = createAdminClient() // Use admin to bypass RLS for check/create
        const { data: profile } = await adminClient
            .from('user_profiles')
            .select('id')
            .eq('id', user.id)
            .single()

        if (!profile) {
            // Profile missing, create it
            // Get User role
            const { data: defaultRole } = await adminClient
                .from('roles')
                .select('id')
                .eq('name', 'User')
                .single() as { data: any }

            const { error: insertError } = await adminClient
                .from('user_profiles')
                .insert({
                    id: user.id,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    role_id: defaultRole?.id || null,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                } as any)

            if (insertError) {
                console.error('Error syncing profile:', insertError)
                return NextResponse.json({ error: insertError.message }, { status: 500 })
            }

            return NextResponse.json({ success: true, message: 'Profile created' })
        }

        return NextResponse.json({ success: true, message: 'Profile exists' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
