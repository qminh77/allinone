/**
 * API Route: Register
 * POST /api/auth/register
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, getRequestInfo } from '@/lib/audit/log'

export async function POST(request: Request) {
    try {
        const { email, password, fullName } = await request.json()

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email và mật khẩu là bắt buộc' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Mật khẩu phải có ít nhất 8 ký tự' },
                { status: 400 }
            )
        }

        // Kiểm tra setting allow_registration
        const supabase = await createClient()
        const { data: setting } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'allow_registration')
            .single()

        if (setting && !setting.value?.enabled) {
            return NextResponse.json(
                { error: 'Đăng ký tạm thời đóng' },
                { status: 403 }
            )
        }

        // Tạo user trong Supabase Auth
        const adminClient = createAdminClient()
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm email
        })

        if (authError || !authData.user) {
            return NextResponse.json(
                { error: authError?.message || 'Không thể tạo tài khoản' },
                { status: 400 }
            )
        }

        // Lấy role "User" mặc định
        const { data: defaultRole } = await adminClient
            .from('roles')
            .select('id')
            .eq('name', 'User')
            .single()

        // Tạo profile trong user_profiles
        const { error: profileError } = await adminClient
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                full_name: fullName || null,
                role_id: defaultRole?.id || null,
                is_active: true,
            })

        if (profileError) {
            console.error('Error creating profile:', profileError)
            // User đã được tạo trong auth, nhưng profile lỗi
            // Có thể xử lý rollback hoặc để user tự hoàn thiện profile
        }

        // Ghi audit log
        const { ipAddress, userAgent } = getRequestInfo(request)
        await createAuditLog({
            userId: authData.user.id,
            action: 'register',
            metadata: { email, full_name: fullName },
            ipAddress,
            userAgent,
        })

        return NextResponse.json({
            success: true,
            message: 'Đăng ký thành công',
        })
    } catch (error: any) {
        console.error('Register error:', error)
        return NextResponse.json(
            { error: error.message || 'Đã có lỗi xảy ra' },
            { status: 500 }
        )
    }
}
