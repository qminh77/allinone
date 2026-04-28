import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveBootstrapRoleId } from '@/lib/auth/bootstrap'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()

        if (existingProfile) {
            try {
                const adminClient = createAdminClient()
                const { roleId, roleName } = await resolveBootstrapRoleId(adminClient as any, user.email)

                if (roleName === 'Admin' && roleId) {
                    await (adminClient.from('user_profiles') as any)
                        .update({ role_id: roleId, updated_at: new Date().toISOString() })
                        .eq('id', user.id)

                    return NextResponse.json({ success: true, message: 'Profile exists', role: roleName })
                }
            } catch {
                // Existing profile is enough for normal login. Admin bootstrap can run after
                // SUPABASE_SERVICE_ROLE_KEY is configured correctly.
            }

            return NextResponse.json({ success: true, message: 'Profile exists' })
        }

        let adminClient: any
        try {
            adminClient = createAdminClient()
        } catch (error) {
            return NextResponse.json(
                { error: error instanceof Error ? error.message : 'Supabase admin client is not configured' },
                { status: 500 }
            )
        }

        {
            const { roleId, roleName } = await resolveBootstrapRoleId(adminClient as any, user.email)

            const { error: insertError } = await adminClient
                .from('user_profiles')
                .insert({
                    id: user.id,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    role_id: roleId || null,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                } as any)

            if (insertError) {
                console.error('Error syncing profile:', insertError)
                return NextResponse.json({ error: insertError.message }, { status: 500 })
            }

            return NextResponse.json({ success: true, message: 'Profile created', role: roleName })
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
